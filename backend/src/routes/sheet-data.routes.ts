import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/rbac.middleware.js";

const router = Router();
router.use(authMiddleware);

type SheetKind = "health" | "medication";

interface DormitorySheet {
  key: string;
  name: string;
  code: string;
  healthGid: string;
  medicationGid: string;
}

const healthSpreadsheetId = "16RBtjndUNNQ6kFhDxornI6A1r96U_67Oyve7fN0nKro";
const medicationSpreadsheetId = "1UzM7TdcfCRRoKbezRLllyu3R91k9DK_8hk_GTq9Tejs";

const dormitorySheets: DormitorySheet[] = [
  { key: "phrae-wa", name: "แพรวา", code: "PR", healthGid: "479103286", medicationGid: "902694052" },
  { key: "phu-thai", name: "ผู้ไท", code: "PT", healthGid: "1244889292", medicationGid: "1467989917" },
  { key: "fa-daet", name: "ฟ้าแดด", code: "FD", healthGid: "1485008828", medicationGid: "789069722" },
  { key: "lam-pao", name: "ลำปาว", code: "LP", healthGid: "441856552", medicationGid: "1698840397" },
  { key: "pong-lang", name: "โปงลาง", code: "PL", healthGid: "1110226563", medicationGid: "809127225" },
  { key: "phu-phan", name: "ภูพาน", code: "PP", healthGid: "1315952585", medicationGid: "1798854628" },
  { key: "song-yang", name: "สงยาง", code: "SY", healthGid: "1258789540", medicationGid: "1057770549" },
  { key: "dinosaur-1", name: "ไดโนเสาร์ 1", code: "D1", healthGid: "879781899", medicationGid: "378906483" },
  { key: "dinosaur-2", name: "ไดโนเสาร์ 2", code: "D2", healthGid: "1918361136", medicationGid: "1066747562" },
  { key: "phayom", name: "พะยอม", code: "PY", healthGid: "414403363", medicationGid: "1459691172" },
  { key: "mahat", name: "มะหาด", code: "MH", healthGid: "2076571431", medicationGid: "1194470351" },
];

function sheetUrl(kind: SheetKind, dormitory: DormitorySheet) {
  const spreadsheetId =
    kind === "health" ? healthSpreadsheetId : medicationSpreadsheetId;
  const gid = kind === "health" ? dormitory.healthGid : dormitory.medicationGid;
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
}

function sheetEditUrl(kind: SheetKind, dormitory: DormitorySheet) {
  const spreadsheetId =
    kind === "health" ? healthSpreadsheetId : medicationSpreadsheetId;
  const gid = kind === "health" ? dormitory.healthGid : dormitory.medicationGid;
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?gid=${gid}#gid=${gid}`;
}

function clean(value: string | undefined) {
  return (value ?? "").replace(/\r/g, "").trim();
}

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const next = csv[i + 1];
    if (char === '"') {
      if (quoted && next === '"') {
        value += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(clean(value));
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i++;
      row.push(clean(value));
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value || row.length > 0) {
    row.push(clean(value));
    if (row.some(Boolean)) rows.push(row);
  }
  return rows;
}

async function fetchRows(kind: SheetKind, dormitory: DormitorySheet) {
  const response = await fetch(sheetUrl(kind, dormitory));
  if (!response.ok) {
    throw new Error(`โหลด Google Sheet ไม่สำเร็จ (${response.status})`);
  }
  return parseCsv(await response.text());
}

function combineHeaders(headerRows: string[][]) {
  const max = Math.max(0, ...headerRows.map((row) => row.length));
  const seen = new Map<string, number>();
  return Array.from({ length: max }, (_, index) => {
    const parts = headerRows
      .map((row) => clean(row[index]))
      .filter(Boolean)
      .filter((part, partIndex, all) => all.indexOf(part) === partIndex);
    const base = parts.join(" ").trim() || `คอลัมน์ ${index + 1}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base} ${count}`;
  });
}

function toObjects(headers: string[], rows: string[][]) {
  return rows
    .filter((row) => row.some((cell) => clean(cell)))
    .map((row, rowIndex) => {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = clean(row[index]);
      });
      return {
        rowNumber: rowIndex + 1,
        cells: row.map(clean),
        record,
      };
    });
}

async function getSheetData(kind: SheetKind, dormitory: DormitorySheet) {
  const rows = await fetchRows(kind, dormitory);
  const headerRows = kind === "health" ? rows.slice(0, 2) : rows.slice(1, 3);
  const dataRows = kind === "health" ? rows.slice(2) : rows.slice(3);
  const headers = combineHeaders(headerRows);
  return {
    dormitory: dormitory.name,
    headers,
    rows: toObjects(headers, dataRows),
    sourceUrl: sheetEditUrl(kind, dormitory),
  };
}

function normalizeName(name: string) {
  return clean(name)
    .replace(/^(เด็กชาย|เด็กหญิง|นาย|นางสาว|นาง|ด\.ช\.|ด\.ญ\.)\s*/i, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function splitFullName(fullName: string) {
  const normalized = clean(fullName).replace(/\s+/g, " ");
  const parts = normalized.split(" ").filter(Boolean);
  if (parts.length <= 1) {
    return { firstName: normalized || "-", lastName: "-" };
  }
  const lastName = parts.pop() ?? "-";
  return { firstName: parts.join(" "), lastName };
}

function compactCode(value: string | undefined) {
  return clean(value).replace(/[^\dA-Za-zก-๙-]/g, "").slice(0, 20);
}

function classRoomFromHealth(row: string[]) {
  const level = clean(row[3]);
  const room = clean(row[4]);
  if (level && room) return `${level}/${room}`;
  return level || null;
}

function bloodTypeFromText(value: string | undefined): "A" | "B" | "AB" | "O" | "unknown" {
  const normalized = clean(value).toUpperCase();
  if (normalized === "A" || normalized === "B" || normalized === "AB" || normalized === "O") {
    return normalized;
  }
  return "unknown";
}

function phoneValue(...values: (string | undefined)[]) {
  return values.map(clean).find(Boolean)?.slice(0, 20) ?? null;
}

function meaningfulText(value: string | undefined) {
  const text = clean(value);
  if (!text || text === "-" || text.toUpperCase() === "FALSE") return "";
  if (text.toUpperCase() === "TRUE") return "";
  return text;
}

function jsonObject(value: Record<string, unknown>): Prisma.InputJsonObject {
  return value as Prisma.InputJsonObject;
}

async function importHealthSheets() {
  let created = 0;
  let updated = 0;
  const studentCodesByName = new Map<string, string>();

  for (const dormitory of dormitorySheets) {
    const sheet = await getSheetData("health", dormitory);
    for (const item of sheet.rows) {
      const fullName = clean(item.cells[1]);
      if (!fullName) continue;

      const generatedCode = `${dormitory.code}-${String(item.rowNumber).padStart(3, "0")}`;
      const studentCode = compactCode(item.cells[6]) || generatedCode;
      const { firstName, lastName } = splitFullName(fullName);
      const record = {
        ...item.record,
        เรือนนอน: dormitory.name,
        แหล่งข้อมูล: "ข้อมูลสุขภาพนักเรียน",
      };
      const data = {
        firstName,
        lastName,
        classRoom: classRoomFromHealth(item.cells),
        dormitory: dormitory.name,
        homeroomTeacher: null,
        bloodType: bloodTypeFromText(item.record["กรุปเลือด"]),
        congenitalDisease: meaningfulText(item.cells[24]) || null,
        drugAllergy:
          meaningfulText(item.cells[27]) ||
          (clean(item.cells[26]).toUpperCase() === "TRUE"
            ? "มีประวัติแพ้ยา/อาหาร"
            : null),
        regularMedication: meaningfulText(item.cells[25]) || null,
        parentName: clean(item.cells[10]) || null,
        parentPhone: phoneValue(item.cells[11], item.cells[12]),
        healthData: jsonObject(record),
        isActive: true,
      };

      const existing = await prisma.student.findUnique({ where: { studentCode } });
      if (existing) {
        await prisma.student.update({ where: { studentCode }, data });
        updated++;
      } else {
        await prisma.student.create({
          data: {
            studentCode,
            ...data,
          },
        });
        created++;
      }
      studentCodesByName.set(`${dormitory.name}:${normalizeName(fullName)}`, studentCode);
    }
  }

  return { created, updated, studentCodesByName };
}

function medicationSummary(medications: Record<string, string>[]) {
  return medications
    .map((med) => {
      const name = med["ข้อมูลยา ชื่อยา"] || med["ชื่อยา"] || "";
      const strength = med["ข้อมูลยา ขนาดยา"] || med["ขนาดยา"] || "";
      const morning = med["การรับประทาน เช้า"] || "";
      const noon = med["การรับประทาน เที่ยง"] || "";
      const evening = med["การรับประทาน เย็น"] || "";
      const bedtime = med["การรับประทาน ก่อนนอน"] || "";
      return [name, strength, morning, noon, evening, bedtime].filter(Boolean).join(" ");
    })
    .filter(Boolean)
    .join("; ");
}

async function importMedicationSheets(studentCodesByName: Map<string, string>) {
  let updated = 0;
  let created = 0;

  for (const dormitory of dormitorySheets) {
    const sheet = await getSheetData("medication", dormitory);
    let currentName = "";
    let currentCode = "";
    const grouped = new Map<string, Record<string, string>[]>();

    for (const item of sheet.rows) {
      const rowName = clean(item.cells[5]);
      if (rowName) {
        currentName = rowName;
        currentCode =
          studentCodesByName.get(`${dormitory.name}:${normalizeName(rowName)}`) ||
          `${dormitory.code}-MED-${String(item.rowNumber).padStart(3, "0")}`;
      }
      if (!currentName || !currentCode) continue;
      const record = {
        ...item.record,
        เรือนนอน: dormitory.name,
        แหล่งข้อมูล: "ข้อมูลยาประจำตัวนักเรียน",
      };
      const list = grouped.get(currentCode) ?? [];
      list.push(record);
      grouped.set(currentCode, list);
    }

    for (const [studentCode, medications] of grouped.entries()) {
      const summary = medicationSummary(medications);
      const existing = await prisma.student.findUnique({ where: { studentCode } });
      if (existing) {
        await prisma.student.update({
          where: { studentCode },
          data: {
            regularMedication: summary || existing.regularMedication,
            medicationData: jsonObject({ เรือนนอน: dormitory.name, รายการยา: medications }),
          },
        });
        updated++;
      } else {
        const firstRecord = medications[0] ?? {};
        const fullName = clean(firstRecord["ข้อมูลส่วนตัว ชื่อ-นามสกุล"]);
        const { firstName, lastName } = splitFullName(fullName);
        await prisma.student.create({
          data: {
            studentCode: compactCode(studentCode) || studentCode.slice(0, 20),
            firstName,
            lastName,
            classRoom: clean(firstRecord["ข้อมูลส่วนตัว ชั้น"]) || null,
            dormitory: dormitory.name,
            parentPhone: phoneValue(
              String(firstRecord["ข้อมูลส่วนตัว เบอร์โทรศัพท์ผู้ปกครอง"] ?? ""),
            ),
            regularMedication: summary || null,
            medicationData: jsonObject({ เรือนนอน: dormitory.name, รายการยา: medications }),
          },
        });
        created++;
      }
    }
  }

  return { created, updated };
}

router.get("/dormitories", (_req, res) => {
  res.json({ data: dormitorySheets.map(({ key, name }) => ({ key, name })) });
});

router.get("/:kind", async (req, res, next) => {
  try {
    const kind = z.enum(["health", "medication"]).parse(req.params.kind);
    const dormitoryName = String(req.query.dormitory ?? dormitorySheets[0]?.name ?? "");
    const dormitory = dormitorySheets.find((item) => item.name === dormitoryName);
    if (!dormitory) {
      res.status(404).json({ message: "ไม่พบเรือนนอน" });
      return;
    }
    const data = await getSheetData(kind, dormitory);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post("/import-students", requireAdmin, async (_req, res, next) => {
  try {
    const health = await importHealthSheets();
    const medication = await importMedicationSheets(health.studentCodesByName);
    res.json({
      health: { created: health.created, updated: health.updated },
      medication,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
