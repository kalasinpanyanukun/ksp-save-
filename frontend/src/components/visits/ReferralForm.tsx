import { useState, type FormEvent } from "react";
import StudentPicker from "../patients/StudentPicker";
import type { Student } from "../../types";
import type { ReferralInput } from "../../services/visitsService";

interface ReferralFormProps {
  onSubmit: (payload: ReferralInput) => Promise<void> | void;
  onCancel?: () => void;
  submitting?: boolean;
}

function todayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function ReferralForm({
  onSubmit,
  onCancel,
  submitting,
}: ReferralFormProps) {
  const [student, setStudent] = useState<Student | null>(null);
  const [referralDate, setReferralDate] = useState(todayDate());
  const [referralTime, setReferralTime] = useState(nowTime());
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [referredTo, setReferredTo] = useState("");
  const [treatmentGiven, setTreatmentGiven] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!student) {
      setError("กรุณาเลือกนักเรียนก่อน");
      return;
    }
    setError(null);
    await onSubmit({
      studentId: student.id,
      referralDate,
      referralTime,
      chiefComplaint,
      referredTo,
      treatmentGiven: treatmentGiven || null,
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
            value={referralDate}
            onChange={(e) => setReferralDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">เวลา *</label>
          <input
            type="time"
            className="input"
            value={referralTime}
            onChange={(e) => setReferralTime(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="label">มาด้วยอาการ *</label>
        <textarea
          className="input min-h-[80px]"
          value={chiefComplaint}
          onChange={(e) => setChiefComplaint(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="label">นำส่งที่ (โรงพยาบาล) *</label>
        <input
          className="input"
          value={referredTo}
          onChange={(e) => setReferredTo(e.target.value)}
          placeholder="เช่น โรงพยาบาลกาฬสินธุ์"
          required
        />
      </div>

      <div>
        <label className="label">การรักษาเบื้องต้นที่ให้</label>
        <textarea
          className="input min-h-[80px]"
          value={treatmentGiven}
          onChange={(e) => setTreatmentGiven(e.target.value)}
        />
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

      <div className="flex justify-end gap-2 pt-3 border-t border-ksp-blue-50">
        {onCancel && (
          <button type="button" className="btn-outline" onClick={onCancel}>
            ยกเลิก
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "กำลังบันทึก..." : "บันทึกการส่งต่อ"}
        </button>
      </div>
    </form>
  );
}
