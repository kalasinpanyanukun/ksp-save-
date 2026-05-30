import { useEffect, useState, type FormEvent } from "react";
import { Pill, Plus, Trash2 } from "lucide-react";
import type { BloodType, Student, StudentStatus } from "../../types";
import type {
  MedicationEntryInput,
  StudentInput,
} from "../../services/studentsService";
import {
  BLOOD_TYPE_OPTIONS,
  CLASS_ROOM_OPTIONS,
  DORMITORY_OPTIONS,
} from "../../constants/studentOptions";

interface PatientFormProps {
  initial?: Partial<Student>;
  onSubmit: (data: StudentInput) => Promise<void> | void;
  onCancel?: () => void;
  submitting?: boolean;
}

const empty: StudentInput = {
  studentCode: "",
  firstName: "",
  lastName: "",
  classRoom: "",
  dormitory: "",
  homeroomTeacher: "",
  bloodType: "unknown",
  congenitalDisease: "",
  drugAllergy: "",
  regularMedication: "",
  parentName: "",
  parentPhone: "",
  studentStatus: "resident",
};

const STUDENT_STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: "resident", label: "ประจำ" },
  { value: "infirmary", label: "ป่วย(นอนเรือนบาล)" },
  { value: "home_leave", label: "ลากลับบ้าน" },
];

const emptyMed: MedicationEntryInput = {
  name: "",
  morning: "",
  noon: "",
  evening: "",
  bedtime: "",
};

const MEAL_FIELDS: { key: keyof MedicationEntryInput; label: string }[] = [
  { key: "morning", label: "เช้า" },
  { key: "noon", label: "กลางวัน" },
  { key: "evening", label: "เย็น" },
  { key: "bedtime", label: "ก่อนนอน" },
];

function medsFromInitial(initial?: Partial<Student>): MedicationEntryInput[] {
  const data = initial?.medicationData;
  const list =
    data && typeof data === "object" && Array.isArray((data as Record<string, unknown>)["รายการยา"])
      ? ((data as Record<string, unknown>)["รายการยา"] as Record<string, unknown>[])
      : [];
  const pick = (med: Record<string, unknown>, ...keys: string[]) => {
    for (const k of keys) {
      const v = med[k];
      const t = v === null || v === undefined ? "" : String(v).trim();
      if (t && t !== "-") return t;
    }
    return "";
  };
  return list.map((med) => ({
    name: pick(med, "ชื่อยา", "ข้อมูลยา ชื่อยา"),
    morning: pick(med, "เช้า", "การรับประทาน เช้า"),
    noon: pick(med, "เที่ยง", "การรับประทาน เที่ยง"),
    evening: pick(med, "เย็น", "การรับประทาน เย็น"),
    bedtime: pick(med, "ก่อนนอน", "การรับประทาน ก่อนนอน"),
  }));
}

export default function PatientForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: PatientFormProps) {
  const [form, setForm] = useState<StudentInput>(empty);
  const [meds, setMeds] = useState<MedicationEntryInput[]>([]);

  useEffect(() => {
    if (initial) {
      setForm({
        studentCode: initial.studentCode ?? "",
        firstName: initial.firstName ?? "",
        lastName: initial.lastName ?? "",
        classRoom: initial.classRoom ?? "",
        dormitory: initial.dormitory ?? "",
        homeroomTeacher: initial.homeroomTeacher ?? "",
        bloodType: initial.bloodType ?? "unknown",
        congenitalDisease: initial.congenitalDisease ?? "",
        drugAllergy: initial.drugAllergy ?? "",
        regularMedication: initial.regularMedication ?? "",
        parentName: initial.parentName ?? "",
        parentPhone: initial.parentPhone ?? "",
        studentStatus: initial.studentStatus ?? "resident",
      });
      setMeds(medsFromInitial(initial));
    } else {
      setForm(empty);
      setMeds([]);
    }
  }, [initial]);

  function update<K extends keyof StudentInput>(key: K, value: StudentInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateMed(index: number, key: keyof MedicationEntryInput, value: string) {
    setMeds((list) => list.map((m, i) => (i === index ? { ...m, [key]: value } : m)));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const cleaned = meds
      .map((m) => ({
        name: m.name.trim(),
        morning: m.morning?.trim() || "",
        noon: m.noon?.trim() || "",
        evening: m.evening?.trim() || "",
        bedtime: m.bedtime?.trim() || "",
      }))
      .filter((m) => m.name);
    // ส่ง medications เฉพาะเมื่อมีการกรอก (กันการล้างข้อมูลยาเดิมโดยไม่ตั้งใจ)
    onSubmit(cleaned.length > 0 ? { ...form, medications: cleaned } : form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section>
        <h3 className="mb-3 font-semibold text-ksp-navy">ข้อมูลพื้นฐาน</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">รหัสนักเรียน *</label>
            <input
              className="input"
              required
              value={form.studentCode}
              onChange={(e) => update("studentCode", e.target.value)}
              placeholder="เช่น 6601001"
            />
          </div>
          <div>
            <label className="label">ชั้นเรียน</label>
            <select
              className="input"
              value={form.classRoom ?? ""}
              onChange={(e) => update("classRoom", e.target.value)}
            >
              <option value="">เลือกชั้นเรียน</option>
              {CLASS_ROOM_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">ชื่อ *</label>
            <input
              className="input"
              required
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
            />
          </div>
          <div>
            <label className="label">นามสกุล *</label>
            <input
              className="input"
              required
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
            />
          </div>
          <div>
            <label className="label">เรือนนอน</label>
            <select
              className="input"
              value={form.dormitory ?? ""}
              onChange={(e) => update("dormitory", e.target.value)}
            >
              <option value="">เลือกเรือนนอน</option>
              {DORMITORY_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">ครูประจำชั้น</label>
            <input
              className="input"
              value={form.homeroomTeacher ?? ""}
              onChange={(e) => update("homeroomTeacher", e.target.value)}
            />
          </div>
          <div>
            <label className="label">สถานะ</label>
            <select
              className="input"
              value={form.studentStatus ?? "resident"}
              onChange={(e) =>
                update("studentStatus", e.target.value as StudentStatus)
              }
            >
              {STUDENT_STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-semibold text-ksp-navy">ข้อมูลสุขภาพ</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">กรุ๊ปเลือด</label>
            <select
              className="input"
              value={form.bloodType ?? "unknown"}
              onChange={(e) =>
                update("bloodType", e.target.value as BloodType)
              }
            >
              <option value="unknown">ไม่ระบุ</option>
              {BLOOD_TYPE_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">โรคประจำตัว</label>
            <textarea
              className="input min-h-[72px]"
              value={form.congenitalDisease ?? ""}
              onChange={(e) => update("congenitalDisease", e.target.value)}
              placeholder="ระบุโรคประจำตัวถ้ามี"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">การแพ้ยา</label>
            <textarea
              className="input min-h-[72px]"
              value={form.drugAllergy ?? ""}
              onChange={(e) => update("drugAllergy", e.target.value)}
              placeholder="เช่น แพ้ Penicillin"
            />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-ksp-navy">
            <Pill className="h-4 w-4 text-ksp-blue-600" /> ยาประจำตัว
          </h3>
          <button
            type="button"
            className="btn-outline px-3 py-1.5 text-xs"
            onClick={() => setMeds((list) => [...list, { ...emptyMed }])}
          >
            <Plus className="h-3.5 w-3.5" /> เพิ่มยา
          </button>
        </div>
        {meds.length === 0 ? (
          <p className="rounded-lg border border-dashed border-ksp-blue-100 bg-ksp-bg/50 px-3 py-4 text-center text-sm text-ksp-gray">
            ยังไม่มีรายการยา — กด "เพิ่มยา" เพื่อบันทึกชื่อยาและจำนวนตามเวลาที่กิน
          </p>
        ) : (
          <div className="space-y-3">
            {meds.map((med, index) => (
              <div
                key={index}
                className="rounded-xl border border-ksp-blue-100 bg-ksp-bg/40 p-3"
              >
                <div className="mb-2 flex items-center gap-2">
                  <input
                    className="input flex-1"
                    value={med.name}
                    onChange={(e) => updateMed(index, "name", e.target.value)}
                    placeholder="ชื่อยา เช่น Methylphenidate 10 mg"
                  />
                  <button
                    type="button"
                    className="btn-ghost px-2 py-2 text-rose-600 hover:bg-rose-50"
                    onClick={() => setMeds((list) => list.filter((_, i) => i !== index))}
                    title="ลบยา"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {MEAL_FIELDS.map((field) => (
                    <div key={field.key}>
                      <label className="mb-1 block text-[11px] font-medium text-ksp-gray">
                        {field.label}
                      </label>
                      <input
                        className="input px-2.5 py-2 text-sm"
                        value={(med[field.key] as string) ?? ""}
                        onChange={(e) => updateMed(index, field.key, e.target.value)}
                        placeholder="จำนวน"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 font-semibold text-ksp-navy">ผู้ปกครอง</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">ชื่อผู้ปกครอง</label>
            <input
              className="input"
              value={form.parentName ?? ""}
              onChange={(e) => update("parentName", e.target.value)}
            />
          </div>
          <div>
            <label className="label">เบอร์โทรศัพท์</label>
            <input
              className="input"
              value={form.parentPhone ?? ""}
              onChange={(e) => update("parentPhone", e.target.value)}
              placeholder="0XX-XXX-XXXX"
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-2 border-t border-ksp-blue-50 pt-3">
        {onCancel && (
          <button type="button" className="btn-outline" onClick={onCancel}>
            ยกเลิก
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </form>
  );
}
