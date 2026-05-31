import { useState, type ChangeEvent } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, Upload, Loader2 } from "lucide-react";
import {
  importStudents,
  type ImportResult,
  type StudentInput,
} from "../../services/studentsService";
import Modal from "../common/Modal";
import { useToast } from "../common/useToast";
import { BLOOD_TYPE_OPTIONS } from "../../constants/studentOptions";

interface PatientImportProps {
  open: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

const FIELD_ALIASES: Record<
  Exclude<keyof StudentInput, "medications" | "guardians" | "healthExtra">,
  string[]
> = {
  studentCode: ["studentCode", "รหัสนักเรียน", "รหัส", "รหัสประจำตัว"],
  firstName: ["firstName", "ชื่อ", "ชื่อจริง"],
  lastName: ["lastName", "นามสกุล", "สกุล"],
  nickname: ["nickname", "ชื่อเล่น"],
  classRoom: ["classRoom", "ชั้นเรียน", "ชั้น", "ระดับชั้น"],
  dormitory: ["dormitory", "เรือนนอน"],
  homeroomTeacher: ["homeroomTeacher", "ครูประจำชั้น", "ครูที่ปรึกษา"],
  homeroomTeacherPhone: ["homeroomTeacherPhone", "เบอร์ครูประจำชั้น", "เบอร์โทรครูประจำชั้น"],
  bloodType: ["bloodType", "กรุปเลือด", "หมู่เลือด", "กรุ๊ปเลือด"],
  congenitalDisease: ["congenitalDisease", "โรคประจำตัว"],
  drugAllergy: ["drugAllergy", "การแพ้ยา", "แพ้ยา", "แพ้ยา/อาหาร"],
  regularMedication: ["regularMedication", "ยาประจำตัว"],
  parentName: ["parentName", "ผู้ปกครอง", "ชื่อผู้ปกครอง"],
  parentPhone: ["parentPhone", "เบอร์ผู้ปกครอง", "เบอร์โทร", "เบอร์โทรศัพท์"],
  studentStatus: ["studentStatus", "สถานะ"],
};

function pick<T extends Record<string, unknown>>(
  row: T,
  aliases: readonly string[],
): string | undefined {
  for (const a of aliases) {
    const v = row[a];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v).trim();
    }
  }
  return undefined;
}

function normalizeBlood(value: string | undefined) {
  if (!value) return undefined;
  const v = value.toUpperCase().trim();
  if (BLOOD_TYPE_OPTIONS.includes(v as never)) {
    return v as StudentInput["bloodType"];
  }
  return undefined;
}

function normalizeStudentStatus(value: string | undefined) {
  const text = value?.trim();
  if (text === "ป่วย(นอนเรือนบาล)" || text === "ป่วย" || text === "infirmary") {
    return "infirmary" as const;
  }
  if (text === "ลากลับบ้าน" || text === "กลับบ้าน" || text === "home_leave") {
    return "home_leave" as const;
  }
  return "resident" as const;
}

function parseRows(rows: Record<string, unknown>[]): StudentInput[] {
  return rows
    .map((row) => {
      const studentCode = pick(row, FIELD_ALIASES.studentCode);
      const firstName = pick(row, FIELD_ALIASES.firstName);
      const lastName = pick(row, FIELD_ALIASES.lastName);
      if (!studentCode || !firstName || !lastName) return null;
      const parentName = pick(row, FIELD_ALIASES.parentName) ?? null;
      const parentPhone = pick(row, FIELD_ALIASES.parentPhone) ?? null;
      const healthExtra = {
        idCard: pick(row, ["เลขบัตรประชาชน", "idCard"]),
        birthDate: pick(row, ["วันเดือนปีเกิด", "วันเกิด", "birthDate"]),
        disabilityType: pick(row, ["ประเภทความพิการ", "ความพิการ", "disabilityType"]),
        ageType: pick(row, ["เด็กเก่า/ใหม่", "เด็กเก่าใหม่", "ageType"]),
        address: pick(row, ["ที่อยู่", "address"]),
        weight: pick(row, ["น้ำหนัก", "weight"]),
        height: pick(row, ["ส่วนสูง", "height"]),
        healthRight: pick(row, ["สิทธิ", "สิทธิการรักษา", "healthRight"]),
        physicalResult: pick(row, ["ผลตรวจร่างกาย", "physicalResult"]),
        allergySymptom: pick(row, ["อาการแสดงการแพ้", "อาการแพ้"]),
        menstruation: pick(row, ["การมีประจำเดือน", "menstruation"]),
        contraceptionMethod: pick(row, ["การคุมกำเนิด", "วิธีการคุมกำเนิด"]),
        contraceptionLastDate: pick(row, ["วันที่คุมกำเนิดล่าสุด"]),
        contraceptionNextDate: pick(row, ["นัดคุมกำเนิดครั้งถัดไป"]),
        injectionLastDate: pick(row, ["วันที่ฉีดยาคุมล่าสุด"]),
        injectionPlace: pick(row, ["สถานที่ฉีดยาคุม"]),
        injectionNextDate: pick(row, ["นัดฉีดยาคุมครั้งถัดไป"]),
        injectionSideEffects: pick(row, ["อาการผิดปกติหลังฉีดยาคุม"]),
      };
      const hasHealthExtra = Object.values(healthExtra).some(Boolean);
      const item: StudentInput = {
        studentCode,
        firstName,
        lastName,
        nickname: pick(row, FIELD_ALIASES.nickname) ?? null,
        classRoom: pick(row, FIELD_ALIASES.classRoom) ?? null,
        dormitory: pick(row, FIELD_ALIASES.dormitory) ?? null,
        homeroomTeacher: pick(row, FIELD_ALIASES.homeroomTeacher) ?? null,
        homeroomTeacherPhone: pick(row, FIELD_ALIASES.homeroomTeacherPhone) ?? null,
        bloodType: normalizeBlood(pick(row, FIELD_ALIASES.bloodType)),
        congenitalDisease: pick(row, FIELD_ALIASES.congenitalDisease) ?? null,
        drugAllergy: pick(row, FIELD_ALIASES.drugAllergy) ?? null,
        regularMedication: pick(row, FIELD_ALIASES.regularMedication) ?? null,
        parentName,
        parentPhone,
        guardians: parentName || parentPhone ? [{ name: parentName ?? "", phone: parentPhone ?? "" }] : [],
        studentStatus: normalizeStudentStatus(pick(row, FIELD_ALIASES.studentStatus)),
        ...(hasHealthExtra ? { healthExtra } : {}),
      };
      return item;
    })
    .filter((x): x is StudentInput => x !== null);
}

export default function PatientImport({
  open,
  onClose,
  onCompleted,
}: PatientImportProps) {
  const toast = useToast();
  const [rows, setRows] = useState<StudentInput[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const firstSheetName = wb.SheetNames[0];
    if (!firstSheetName) {
      toast("ไม่พบ sheet ในไฟล์", "error");
      return;
    }
    const ws = wb.Sheets[firstSheetName];
    if (!ws) {
      toast("ไม่สามารถอ่าน sheet ได้", "error");
      return;
    }
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
      defval: "",
    });
    const parsed = parseRows(json);
    if (parsed.length === 0) {
      toast("ไม่พบข้อมูลที่อ่านได้ (ต้องมีคอลัมน์ รหัสนักเรียน / ชื่อ / นามสกุล)", "error");
    }
    setRows(parsed);
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setSubmitting(true);
    try {
      const res = await importStudents(rows);
      setResult(res);
      toast(
        `นำเข้าเรียบร้อย: เพิ่ม ${res.created} / อัปเดต ${res.updated} / ผิดพลาด ${res.errors.length}`,
        res.errors.length === 0 ? "success" : "warning",
      );
      onCompleted?.();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "นำเข้าข้อมูลไม่สำเร็จ";
      toast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  function downloadTemplate() {
    const a = document.createElement("a");
    a.href = "/ksp_save_students_template.xlsx";
    a.download = "ksp_save_students_template.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function reset() {
    setRows([]);
    setFileName("");
    setResult(null);
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="นำเข้านักเรียนจาก Excel / CSV"
      size="lg"
      footer={
        <>
          <button
            type="button"
            className="btn-outline"
            onClick={downloadTemplate}
          >
            <FileSpreadsheet className="h-4 w-4" /> ดาวน์โหลด template
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={rows.length === 0 || submitting}
            onClick={handleImport}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            นำเข้า {rows.length > 0 ? `${rows.length} รายการ` : ""}
          </button>
        </>
      }
    >
      <p className="text-sm text-ksp-gray mb-3">
        รองรับไฟล์ <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong>{" "}
        แถวแรกต้องเป็นชื่อคอลัมน์
      </p>
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFile}
        className="block w-full text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-ksp-blue-500 file:px-4 file:py-2 file:text-white hover:file:bg-ksp-blue-600 file:cursor-pointer"
      />
      {fileName && (
        <p className="text-xs text-ksp-gray mt-2">ไฟล์: {fileName}</p>
      )}
      {rows.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-ksp-navy mb-2">
            ดูตัวอย่าง {Math.min(rows.length, 5)} จาก {rows.length} รายการ
          </h4>
          <div className="overflow-x-auto border border-ksp-blue-50 rounded-xl">
            <table className="table-base">
              <thead>
                <tr>
                  <th>รหัส</th>
                  <th>ชื่อ-สกุล</th>
                  <th>ชั้น</th>
                  <th>เรือนนอน</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((r) => (
                  <tr key={r.studentCode}>
                    <td>{r.studentCode}</td>
                    <td>
                      {r.firstName} {r.lastName}
                    </td>
                    <td>{r.classRoom ?? "-"}</td>
                    <td>{r.dormitory ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {result && (
        <div className="mt-4 rounded-xl bg-ksp-blue-50 border border-ksp-blue-100 px-4 py-3 text-sm">
          <div className="font-medium text-ksp-navy">ผลการนำเข้า</div>
          <ul className="mt-1 text-ksp-navy/90">
            <li>เพิ่มใหม่: {result.created}</li>
            <li>อัปเดต: {result.updated}</li>
            <li>ผิดพลาด: {result.errors.length}</li>
          </ul>
          {result.errors.length > 0 && (
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer">ดูข้อผิดพลาด</summary>
              <ul className="mt-1 space-y-0.5 text-rose-700">
                {result.errors.slice(0, 20).map((e, i) => (
                  <li key={i}>
                    [{e.studentCode}] {e.message}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </Modal>
  );
}
