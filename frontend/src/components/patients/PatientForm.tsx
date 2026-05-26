import { useEffect, useState, type FormEvent } from "react";
import type { BloodType, Student } from "../../types";
import type { StudentInput } from "../../services/studentsService";

interface PatientFormProps {
  initial?: Partial<Student>;
  onSubmit: (data: StudentInput) => Promise<void> | void;
  onCancel?: () => void;
  submitting?: boolean;
}

const bloodOptions: { value: BloodType; label: string }[] = [
  { value: "unknown", label: "ไม่ระบุ" },
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "AB", label: "AB" },
  { value: "O", label: "O" },
];

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
};

export default function PatientForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: PatientFormProps) {
  const [form, setForm] = useState<StudentInput>(empty);

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
      });
    } else {
      setForm(empty);
    }
  }, [initial]);

  function update<K extends keyof StudentInput>(key: K, value: StudentInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section>
        <h3 className="font-semibold text-ksp-navy mb-3">ข้อมูลพื้นฐาน</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <input
              className="input"
              value={form.classRoom ?? ""}
              onChange={(e) => update("classRoom", e.target.value)}
              placeholder="เช่น ม.3/1"
            />
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
            <input
              className="input"
              value={form.dormitory ?? ""}
              onChange={(e) => update("dormitory", e.target.value)}
              placeholder="เช่น เรือนนอนชาย 1"
            />
          </div>
          <div>
            <label className="label">ครูประจำชั้น</label>
            <input
              className="input"
              value={form.homeroomTeacher ?? ""}
              onChange={(e) => update("homeroomTeacher", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-ksp-navy mb-3">ข้อมูลสุขภาพ</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">กรุปเลือด</label>
            <select
              className="input"
              value={form.bloodType ?? "unknown"}
              onChange={(e) =>
                update("bloodType", e.target.value as BloodType)
              }
            >
              {bloodOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
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
          <div className="sm:col-span-2">
            <label className="label">ยาประจำตัว</label>
            <textarea
              className="input min-h-[72px]"
              value={form.regularMedication ?? ""}
              onChange={(e) => update("regularMedication", e.target.value)}
              placeholder="ยาที่ต้องรับประทานประจำ"
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-ksp-navy mb-3">ผู้ปกครอง</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <div className="flex justify-end gap-2 pt-3 border-t border-ksp-blue-50">
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
