import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/rbac.middleware.js";

const router = Router();
router.use(authMiddleware);

type SheetKind = "health" | "medication";
type StoredRecord = Record<string, string> & { __studentId?: string };

interface DormitorySheet {
  key: string;
  name: string;
  code: string;
  healthGid: string;
  medicationGid: string;
  /** ครูพยาบาลผู้รับผิดชอบจัดยาประจำเรือนนอน (ค่าคงที่จากชีตยา) */
  teacher: string;
}

const healthSpreadsheetId = "16RBtjndUNNQ6kFhDxornI6A1r96U_67Oyve7fN0nKro";
const medicationSpreadsheetId = "1UzM7TdcfCRRoKbezRLllyu3R91k9DK_8hk_GTq9Tejs";

const dormitorySheets: DormitorySheet[] = [
  { key: "phrae-wa", name: "แพรวา", code: "PR", healthGid: "479103286", medicationGid: "902694052", teacher: "ครูเนตรนภา ดีพรม (ครูหมิว) · 080-7497112" },
  { key: "phu-thai", name: "ผู้ไท", code: "PT", healthGid: "1244889292", medicationGid: "1467989917", teacher: "ครูธนัชกร มูลมี (ครูเจมส์) · 088-0377364" },
  { key: "fa-daet", name: "ฟ้าแดด", code: "FD", healthGid: "1485008828", medicationGid: "789069722", teacher: "ครูนิศาชล พลแสน (ปู) · 080-4175831" },
  { key: "lam-pao", name: "ลำปาว", code: "LP", healthGid: "441856552", medicationGid: "1698840397", teacher: "ครูกุ้ง" },
  { key: "pong-lang", name: "โปงลาง", code: "PL", healthGid: "1110226563", medicationGid: "809127225", teacher: "ครูบรวี คำโฮง (ครูอ๋อม) · 099-1701159" },
  { key: "phu-phan", name: "ภูพาน", code: "PP", healthGid: "1315952585", medicationGid: "1798854628", teacher: "ครูอานันตยา วะรินทร์ (ครูโอ๊ะเอ๊ะ) · 090-3602343" },
  { key: "song-yang", name: "สงยาง", code: "SY", healthGid: "1258789540", medicationGid: "1057770549", teacher: "ครูสินีนาถ อุสาพรหม (ครูดาว) · 098-6198012" },
  { key: "dinosaur-1", name: "ไดโนเสาร์ 1", code: "D1", healthGid: "879781899", medicationGid: "378906483", teacher: "ครูแบม" },
  { key: "dinosaur-2", name: "ไดโนเสาร์ 2", code: "D2", healthGid: "1918361136", medicationGid: "1066747562", teacher: "พี่ป้อม" },
  { key: "phayom", name: "พะยอม", code: "PY", healthGid: "414403363", medicationGid: "1459691172", teacher: "ครูทิพวรรณ วงศ์กนิษฐ์ (ครูเนส) · 097-9742493" },
  { key: "mahat", name: "มะหาด", code: "MH", healthGid: "2076571431", medicationGid: "1194470351", teacher: "ครูฤทธิเกียรติ นามเกษ (ครูเบส) · 090-9109777" },
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

async function getGoogleSheetData(kind: SheetKind, dormitory: DormitorySheet) {
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

function jsonRecord(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function displayValue(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.length ? `${value.length} รายการ` : "";
  return JSON.stringify(value);
}

function addRecordValue(
  record: Record<string, string>,
  key: string,
  value: unknown,
) {
  const text = displayValue(value);
  if (!text) return;
  if (!record[key]) record[key] = text;
}

function shouldSkipStoredKey(kind: SheetKind, key: string) {
  const commonHidden = new Set([
    "__studentId",
    "ลำดับ",
    "รหัสนักเรียน",
    "เลขประจำตัวนักเรียน",
    "เลขบัตรประชาชน",
    "ชื่อ-สกุล",
    "ชื่อ-นามสกุล",
    "ชั้น",
    "ชั้นเรียน",
    "ห้อง",
    "เรือนนอน",
    "แหล่งข้อมูล",
  ]);
  if (commonHidden.has(key)) return true;
  if (kind === "health") {
    return [
      "โรคประจำตัว",
      "ยาประจำตัว",
      "แพ้ยา/อาหาร",
      "ผู้ปกครอง",
      "เบอร์โทร",
    ].includes(key);
  }
  return key.includes("ข้อมูลส่วนตัว") || key.includes("ข้อมูลยา") || key.includes("การรับประทาน");
}

function buildStoredResponse(
  kind: SheetKind,
  dormitory: DormitorySheet,
  records: StoredRecord[],
) {
  const baseHeaders =
    kind === "health"
      ? [
          "รหัสนักเรียน",
          "รหัสบัตรประชาชน",
          "ชื่อ-สกุล",
          "ชั้นเรียน",
          "เรือนนอน",
          "โรคประจำตัว",
          "ยาประจำตัว",
          "แพ้ยา/อาหาร",
          "ผู้ปกครอง",
          "เบอร์โทร",
        ]
      : [
          "รหัสนักเรียน",
          "รหัสบัตรประชาชน",
          "ชื่อ-สกุล",
          "ชั้นเรียน",
          "เรือนนอน",
          "จำนวนชนิดยา",
          "รายการยา",
        ];
  const headers = [...baseHeaders];
  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (key.startsWith("__")) continue;
      if (!headers.includes(key)) headers.push(key);
    }
  }

  return {
    dormitory: dormitory.name,
    teacher: kind === "medication" ? dormitory.teacher : undefined,
    headers,
    rows: records.map((record, rowIndex) => ({
      rowNumber: rowIndex + 1,
      studentId: record.__studentId,
      cells: headers.map((header) => record[header] ?? ""),
      record: Object.fromEntries(headers.map((header) => [header, record[header] ?? ""])),
    })),
    sourceUrl: sheetEditUrl(kind, dormitory),
    storage: "supabase",
  };
}

function medicationList(student: { medicationData: Prisma.JsonValue }) {
  const medicationData = jsonRecord(student.medicationData);
  return Array.isArray(medicationData["รายการยา"])
    ? (medicationData["รายการยา"] as Record<string, unknown>[])
    : [];
}

function isFromHealthSheet(student: { healthData: Prisma.JsonValue }) {
  const healthRecord = jsonRecord(student.healthData);
  return healthRecord["แหล่งข้อมูล"] === "ข้อมูลสุขภาพนักเรียน";
}

async function getStoredSheetData(kind: SheetKind, dormitory: DormitorySheet) {
  const allStudents = await prisma.student.findMany({
    where: {
      isActive: true,
      dormitory: dormitory.name,
    },
    orderBy: [{ classRoom: "asc" }, { firstName: "asc" }, { lastName: "asc" }],
  });

  // แต่ละเมนูสะท้อนชีตของตัวเอง: สุขภาพ = คนจากชีตสุขภาพ, ยา = คนที่มีรายการยาจริง
  const students =
    kind === "health"
      ? allStudents.filter(isFromHealthSheet)
      : allStudents.filter((student) => medicationList(student).length > 0);

  const records: StoredRecord[] = [];
  for (const student of students) {
    const healthRecord = jsonRecord(student.healthData);
    const base = {
      "รหัสนักเรียน":
        displayValue(healthRecord["รหัสนักเรียน"]) ||
        displayValue(healthRecord["เลขประจำตัวนักเรียน"]),
      "รหัสบัตรประชาชน":
        displayValue(healthRecord["เลขบัตรประชาชน"]) || student.studentCode,
      "ชื่อ-สกุล": `${student.firstName} ${student.lastName}`,
      "ชั้นเรียน": student.classRoom ?? "",
      "เรือนนอน": student.dormitory ?? "",
    };

    if (kind === "health") {
      const record: StoredRecord = {
        __studentId: student.id,
        ...base,
        "โรคประจำตัว": student.congenitalDisease ?? "",
        "ยาประจำตัว": student.regularMedication ?? "",
        "แพ้ยา/อาหาร": student.drugAllergy ?? "",
        "ผู้ปกครอง": student.parentName ?? "",
        "เบอร์โทร": student.parentPhone ?? "",
      };
      for (const [key, value] of Object.entries(healthRecord)) {
        if (shouldSkipStoredKey(kind, key)) continue;
        addRecordValue(record, key, value);
      }
      records.push(record);
    } else {
      const medications = medicationList(student);
      records.push({
        __studentId: student.id,
        ...base,
        "จำนวนชนิดยา": String(medications.length),
        "รายการยา": medicationSummary(
          medications.map((medication) =>
            Object.fromEntries(
              Object.entries(medication).map(([key, value]) => [
                key,
                displayValue(value),
              ]),
            ) as Record<string, string>,
          ),
        ),
      });
    }
  }

  return buildStoredResponse(kind, dormitory, records);
}

function normalizeName(name: string) {
  return clean(name)
    // ยุบสระ/วรรณยุกต์ไทยที่พิมพ์ซ้ำ (เช่น "เด็็ก" -> "เด็ก") ให้จับคู่ชื่อได้แม่นขึ้น
    .replace(/([ะ-๎])\1+/g, "$1")
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
    const sheet = await getGoogleSheetData("health", dormitory);
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

/** กุญแจจับคู่ชื่อ: ชื่อปกติ + (นามสกุล|ชุดอักษรชื่อเรียงลำดับ) เพื่อรองรับการสลับชื่อ-สกุล */
function nameMatchKeys(fullName: string) {
  const norm = normalizeName(fullName);
  const parts = norm.split(" ").filter(Boolean);
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  const first = parts.slice(0, parts.length > 1 ? -1 : 1).join("");
  const sortedFirst = first.split("").sort().join("");
  return { norm, charKey: last ? `${last}|${sortedFirst}` : "" };
}

function classRoomFromMedication(row: string[]) {
  return clean(row[6]) || null;
}

interface MedicationBlock {
  name: string;
  classRoom: string | null;
  phone: string | null;
  medications: Record<string, string>[];
}

async function importMedicationSheets(studentCodesByName: Map<string, string>) {
  let updated = 0;
  let created = 0;

  // ลบนักเรียนที่สร้างจากชีตยาล้วน (รวม ghost เก่า) เพื่อให้ import ซ้ำได้โดยไม่สะสม
  // ลบเฉพาะที่ยังไม่มีประวัติ OPD/Admit/ส่งต่อ (กัน FK Restrict)
  await prisma.student.deleteMany({
    where: {
      studentCode: { contains: "-MED" },
      opdVisits: { none: {} },
      admissions: { none: {} },
      referrals: { none: {} },
    },
  });

  for (const dormitory of dormitorySheets) {
    const sheet = await getGoogleSheetData("medication", dormitory);

    // จัดกลุ่มยาแยกตามนักเรียน (แถวต่อเนื่องที่ไม่มีชื่อ = ยาเพิ่มของคนล่าสุด)
    const blocks: MedicationBlock[] = [];
    let current: MedicationBlock | null = null;
    for (const item of sheet.rows) {
      const rowName = clean(item.cells[5]);
      if (rowName) {
        current = {
          name: rowName,
          classRoom: classRoomFromMedication(item.cells),
          phone: phoneValue(item.cells[7], item.cells[8]),
          medications: [],
        };
        blocks.push(current);
      }
      if (!current) continue;
      // นับเป็นรายการยาเฉพาะแถวที่มีชื่อยาจริง (กันแถวว่าง/แถวสูตรคำนวณ)
      if (!clean(item.cells[12])) continue;
      current.medications.push({
        ...item.record,
        เรือนนอน: dormitory.name,
        แหล่งข้อมูล: "ข้อมูลยาประจำตัวนักเรียน",
      });
    }

    // กุญแจจับคู่กับนักเรียนจากชีตสุขภาพ (ชื่อปกติ + ชุดอักษร)
    const healthStudents = await prisma.student.findMany({
      where: { dormitory: dormitory.name },
      select: { studentCode: true, firstName: true, lastName: true },
    });
    const byNorm = new Map<string, string>();
    const byChar = new Map<string, string>();
    for (const student of healthStudents) {
      const keys = nameMatchKeys(`${student.firstName} ${student.lastName}`);
      if (keys.norm && !byNorm.has(keys.norm)) byNorm.set(keys.norm, student.studentCode);
      if (keys.charKey && !byChar.has(keys.charKey)) byChar.set(keys.charKey, student.studentCode);
    }

    // รวมยาตามปลายทาง (นักเรียนเดิมที่จับคู่ได้ หรือ med-only ที่ต้องสร้างใหม่)
    const matched = new Map<string, Record<string, string>[]>();
    const medOnly: MedicationBlock[] = [];
    for (const block of blocks) {
      if (block.medications.length === 0) continue;
      const keys = nameMatchKeys(block.name);
      const code =
        studentCodesByName.get(`${dormitory.name}:${keys.norm}`) ||
        byNorm.get(keys.norm) ||
        (keys.charKey ? byChar.get(keys.charKey) : undefined);
      if (code) {
        matched.set(code, [...(matched.get(code) ?? []), ...block.medications]);
      } else {
        medOnly.push(block);
      }
    }

    for (const [studentCode, medications] of matched.entries()) {
      const summary = medicationSummary(medications);
      const existing = await prisma.student.findUnique({ where: { studentCode } });
      if (!existing) continue;
      await prisma.student.update({
        where: { studentCode },
        data: {
          regularMedication: summary || existing.regularMedication,
          medicationData: jsonObject({ เรือนนอน: dormitory.name, รายการยา: medications }),
        },
      });
      updated++;
    }

    let seq = 0;
    for (const block of medOnly) {
      seq++;
      const { firstName, lastName } = splitFullName(block.name);
      const studentCode = `${dormitory.code}-MED-${String(seq).padStart(3, "0")}`;
      await prisma.student.create({
        data: {
          studentCode,
          firstName,
          lastName,
          classRoom: block.classRoom,
          dormitory: dormitory.name,
          parentPhone: block.phone,
          regularMedication: medicationSummary(block.medications) || null,
          medicationData: jsonObject({ เรือนนอน: dormitory.name, รายการยา: block.medications }),
          isActive: true,
        },
      });
      created++;
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
    const source = String(req.query.source ?? "supabase");
    const data =
      source === "google"
        ? await getGoogleSheetData(kind, dormitory)
        : await getStoredSheetData(kind, dormitory);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export async function runSheetImport() {
  const health = await importHealthSheets();
  const medication = await importMedicationSheets(health.studentCodesByName);
  return {
    health: { created: health.created, updated: health.updated },
    medication,
  };
}

router.post("/import-students", requireAdmin, async (_req, res, next) => {
  try {
    res.json(await runSheetImport());
  } catch (err) {
    next(err);
  }
});

export default router;
