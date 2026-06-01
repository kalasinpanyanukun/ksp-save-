import { useEffect, useState, type FormEvent } from "react";
import StudentPicker from "../patients/StudentPicker";
import MedicationPicker from "./MedicationPicker";
import type { OpdMedicationItem, OpdVisit, Student } from "../../types";
import type { OpdInput } from "../../services/visitsService";

interface OPDFormProps {
  initial?: OpdVisit | null;
  initialStudent?: Student | null;
  onSubmit: (payload: OpdInput) => Promise<void> | void;
  onCancel?: () => void;
  submitting?: boolean;
}

function nowDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function nowTimeString(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function inputDate(value?: string | Date | null): string {
  if (!value) return nowDateString();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return nowDateString();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function OPDForm({
  initial,
  initialStudent,
  onSubmit,
  onCancel,
  submitting,
}: OPDFormProps) {
  const [student, setStudent] = useState<Student | null>(initial?.student ?? initialStudent ?? null);
  const [visitDate, setVisitDate] = useState(inputDate(initial?.visitDate));
  const [visitTime, setVisitTime] = useState(initial?.visitTime ?? nowTimeString());
  const [chiefComplaint, setChiefComplaint] = useState(initial?.chiefComplaint ?? "");
  const [diagnosis, setDiagnosis] = useState(initial?.diagnosis ?? "");
  const [treatment, setTreatment] = useState(initial?.treatment ?? "");
  const [medications, setMedications] = useState<OpdMedicationItem[]>(initial?.medications ?? []);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStudent(initial?.student ?? initialStudent ?? null);
    setVisitDate(inputDate(initial?.visitDate));
    setVisitTime(initial?.visitTime ?? nowTimeString());
    setChiefComplaint(initial?.chiefComplaint ?? "");
    setDiagnosis(initial?.diagnosis ?? "");
    setTreatment(initial?.treatment ?? "");
    setMedications(initial?.medications ?? []);
    setNotes(initial?.notes ?? "");
    setError(null);
  }, [initial, initialStudent]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!student) {
      setError("กรุณาเลือกนักเรียนก่อน");
      return;
    }
    setError(null);
    await onSubmit({
      studentId: student.id,
      visitDate,
      visitTime,
      chiefComplaint,
      diagnosis: diagnosis || null,
      treatment: treatment || null,
      medications,
      notes: notes || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="label">นักเรียน *</label>
        <StudentPicker value={student} onChange={setStudent} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">วันที่ *</label>
          <input
            type="date"
            className="input"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">เวลา *</label>
          <input
            type="time"
            className="input"
            value={visitTime}
            onChange={(e) => setVisitTime(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="label">อาการที่มา (Chief complaint) *</label>
        <textarea
          className="input min-h-[80px]"
          value={chiefComplaint}
          onChange={(e) => setChiefComplaint(e.target.value)}
          required
          placeholder="เช่น ปวดศีรษะ ไข้ ไอ มา 1 วัน"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">การวินิจฉัย</label>
          <textarea
            className="input min-h-[80px]"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
        </div>
        <div>
          <label className="label">การรักษา</label>
          <textarea
            className="input min-h-[80px]"
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
            placeholder="เช่น พักสังเกตอาการ จ่ายยา"
          />
        </div>
      </div>

      <div>
        <label className="label">ยา / เวชภัณฑ์ที่จ่าย</label>
        <MedicationPicker value={medications} onChange={setMedications} />
      </div>

      <div>
        <label className="label">หมายเหตุ</label>
        <textarea
          className="input min-h-[60px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2 border-t border-ksp-blue-50 pt-3 max-sm:[&_button]:w-full">
        {onCancel && (
          <button type="button" className="btn-outline" onClick={onCancel}>
            ยกเลิก
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "กำลังบันทึก..." : initial ? "บันทึกการแก้ไข" : "บันทึก OPD"}
        </button>
      </div>
    </form>
  );
}
