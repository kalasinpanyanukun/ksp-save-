import { useEffect, useState, type FormEvent } from "react";
import type { BloodType, Student, StudentStatus } from "../../types";
import type { StudentInput } from "../../services/studentsService";
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
        studentStatus: initial.studentStatus ?? "resident",
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
