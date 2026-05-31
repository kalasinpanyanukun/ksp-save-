import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authMiddleware);

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  classRoom: string | null;
  dormitory: string | null;
  congenitalDisease: string | null;
  drugAllergy: string | null;
  healthData: Prisma.JsonValue;
};

function hd(student: Student, ...keys: string[]) {
  const d = student.healthData;
  if (!d || typeof d !== "object" || Array.isArray(d)) return "";
  const rec = d as Record<string, unknown>;
  for (const k of keys) {
    const v = rec[k];
    const t = v === null || v === undefined ? "" : String(v).trim();
    if (t && t !== "-" && t.toUpperCase() !== "FALSE") return t;
  }
  return "";
}

const fullName = (s: Student) => `${s.firstName} ${s.lastName}`.trim();

const reportTypes = [
  "disease",
  "nutrition",
  "physical",
  "contraception",
  "injection",
] as const;
type ReportType = (typeof reportTypes)[number];

interface ReportColumn {
  header: string;
  weight?: number;
}
interface ReportResult {
  title: string;
  criteria?: string[];
  columns: ReportColumn[];
  rows: { studentId: string; cells: string[] }[];
  summary?: { label: string; value: string }[];
}

function buildReport(type: ReportType, students: Student[]): ReportResult {
  switch (type) {
    case "disease": {
      const list = students.filter((s) => s.congenitalDisease || s.drugAllergy);
      return {
        title: "สรุปโรคประจำตัวและการแพ้",
        criteria: [
          "แสดงเฉพาะนักเรียนที่มีโรคประจำตัว และ/หรือ ประวัติการแพ้ยา/อาหาร",
          "ข้อมูลดึงจากฐานข้อมูลนักเรียน (ข้อมูลสุขภาพ)",
        ],
        columns: [
          { header: "เรือนนอน", weight: 1 },
          { header: "ชื่อ-สกุล", weight: 1.8 },
          { header: "ชื่อเล่น", weight: 0.9 },
          { header: "ชั้น", weight: 0.7 },
          { header: "โรคประจำตัว", weight: 1.6 },
          { header: "แพ้ยา/อาหาร", weight: 1.4 },
          { header: "อาการแพ้", weight: 1.4 },
          { header: "หมายเหตุ", weight: 1.2 },
        ],
        rows: list.map((s) => ({
          studentId: s.id,
          cells: [
            s.dormitory ?? "-",
            fullName(s),
            s.nickname ?? "-",
            s.classRoom ?? "-",
            s.congenitalDisease || "-",
            s.drugAllergy || "-",
            hd(s, "อาการแสดงการแพ้") || "-",
            hd(s, "หมายเหตุ") || "-",
          ],
        })),
      };
    }
    case "nutrition": {
      const list = students.filter((s) => hd(s, "น้ำหนัก (กิโลกรัม)", "น้ำหนัก") || hd(s, "ส่วนสูง (เซนติเมตร)", "ส่วนสูง"));
      const buckets: Record<string, number> = { สมส่วน: 0, ผอม: 0, ท้วม: 0, อ้วน: 0, อื่นๆ: 0 };
      for (const s of list) {
        const r = hd(s, "แปลผล BMI", "แปลผล");
        if (/ผอม|น้อยกว่า/.test(r)) buckets["ผอม"]!++;
        else if (/อ้วน/.test(r)) buckets["อ้วน"]!++;
        else if (/ท้วม|เกิน/.test(r)) buckets["ท้วม"]!++;
        else if (/ปกติ|สมส่วน/.test(r)) buckets["สมส่วน"]!++;
        else buckets["อื่นๆ"]!++;
      }
      return {
        title: "ภาวะโภชนาการ",
        criteria: [
          "เกณฑ์แปลผลภาวะโภชนาการ (น้ำหนัก/ส่วนสูง):",
          "ผอม = น้ำหนักน้อยกว่าเกณฑ์ส่วนสูง · สมส่วน = น้ำหนักตามเกณฑ์",
          "ท้วม = เริ่มมีน้ำหนักเกินเกณฑ์ · อ้วน = น้ำหนักเกินเกณฑ์มาก",
        ],
        columns: [
          { header: "ชื่อ-สกุล", weight: 1.8 },
          { header: "ชื่อเล่น", weight: 0.9 },
          { header: "ชั้น", weight: 0.7 },
          { header: "น้ำหนัก (กก.)", weight: 0.8 },
          { header: "ส่วนสูง (ซม.)", weight: 0.8 },
          { header: "BMI", weight: 0.8 },
          { header: "ประเมินผล", weight: 1.8 },
          { header: "เรือนนอน", weight: 1 },
        ],
        rows: list.map((s) => ({
          studentId: s.id,
          cells: [
            fullName(s),
            s.nickname ?? "-",
            s.classRoom ?? "-",
            hd(s, "น้ำหนัก (กิโลกรัม)", "น้ำหนัก") || "-",
            hd(s, "ส่วนสูง (เซนติเมตร)", "ส่วนสูง") || "-",
            hd(s, "คะแนน BMI", "คะแนน") || "-",
            hd(s, "แปลผล BMI", "แปลผล") || "-",
            s.dormitory ?? "-",
          ],
        })),
        summary: Object.entries(buckets)
          .filter(([, v]) => v > 0)
          .map(([label, v]) => ({ label, value: `${v} คน` })),
      };
    }
    case "physical": {
      const list = students.filter((s) => hd(s, "ผลตรวจร่างกาย"));
      return {
        title: "ผลการตรวจร่างกาย",
        criteria: ["แสดงเฉพาะนักเรียนที่มีผลตรวจร่างกายผิดปกติหรือมีบันทึก"],
        columns: [
          { header: "เรือนนอน", weight: 1 },
          { header: "ชื่อ-สกุล", weight: 1.8 },
          { header: "ชั้น", weight: 0.7 },
          { header: "ผลตรวจร่างกาย", weight: 3 },
        ],
        rows: list.map((s) => ({
          studentId: s.id,
          cells: [s.dormitory ?? "-", fullName(s), s.classRoom ?? "-", hd(s, "ผลตรวจร่างกาย")],
        })),
      };
    }
    case "contraception": {
      const list = students.filter((s) => hd(s, "การคุมกำเนิด") || hd(s, "การมีประจำเดือน"));
      return {
        title: "การคุมกำเนิด",
        criteria: ["แสดงเฉพาะนักเรียนที่มีข้อมูลการคุมกำเนิด / การมีประจำเดือน"],
        columns: [
          { header: "เรือนนอน", weight: 1 },
          { header: "ชื่อ-สกุล", weight: 1.8 },
          { header: "ชื่อเล่น", weight: 0.9 },
          { header: "ชั้น", weight: 0.7 },
          { header: "การมีประจำเดือน", weight: 1.4 },
          { header: "การคุมกำเนิด", weight: 1.8 },
          { header: "วันที่ล่าสุด", weight: 1 },
          { header: "นัดครั้งถัดไป", weight: 1 },
        ],
        rows: list.map((s) => ({
          studentId: s.id,
          cells: [
            s.dormitory ?? "-",
            fullName(s),
            s.nickname ?? "-",
            s.classRoom ?? "-",
            hd(s, "การมีประจำเดือน") || "-",
            hd(s, "การคุมกำเนิด") || "-",
            hd(s, "วันที่คุมกำเนิดล่าสุด") || "-",
            hd(s, "นัดคุมกำเนิดครั้งถัดไป") || "-",
          ],
        })),
      };
    }
    case "injection": {
      const list = students.filter((s) => hd(s, "วันที่ฉีดยาคุมล่าสุด") || hd(s, "สถานที่ฉีดยาคุม"));
      return {
        title: "การฉีดยาคุม",
        criteria: ["แสดงเฉพาะนักเรียนที่มีประวัติการฉีดยาคุมกำเนิด", "* ควรคอนเฟิร์มกับ รพ.สต. ก่อนวันนัด"],
        columns: [
          { header: "เรือนนอน", weight: 1 },
          { header: "ชื่อ-สกุล", weight: 1.8 },
          { header: "ชื่อเล่น", weight: 0.9 },
          { header: "ชั้น", weight: 0.7 },
          { header: "วันที่ฉีดล่าสุด", weight: 1.1 },
          { header: "สถานที่ฉีด", weight: 1.6 },
          { header: "นัดครั้งถัดไป", weight: 1.1 },
          { header: "อาการผิดปกติหลังฉีด", weight: 1.4 },
        ],
        rows: list.map((s) => ({
          studentId: s.id,
          cells: [
            s.dormitory ?? "-",
            fullName(s),
            s.nickname ?? "-",
            s.classRoom ?? "-",
            hd(s, "วันที่ฉีดยาคุมล่าสุด") || "-",
            hd(s, "สถานที่ฉีดยาคุม") || "-",
            hd(s, "นัดฉีดยาคุมครั้งถัดไป") || "-",
            hd(s, "อาการผิดปกติหลังฉีดยาคุม") || "-",
          ],
        })),
      };
    }
  }
}

router.get("/:type", async (req, res, next) => {
  try {
    const type = z.enum(reportTypes).parse(req.params.type);
    const students = (await prisma.student.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        nickname: true,
        classRoom: true,
        dormitory: true,
        congenitalDisease: true,
        drugAllergy: true,
        healthData: true,
      },
      orderBy: [{ dormitory: "asc" }, { classRoom: "asc" }, { firstName: "asc" }],
    })) as Student[];
    const result = buildReport(type, students);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
