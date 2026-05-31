import { useState, type FormEvent } from "react";
import StudentPicker from "../patients/StudentPicker";
import type { DischargeDestination, Student } from "../../types";
import type { AdmissionInput } from "../../services/visitsService";

interface AdmissionFormProps {
  onSubmit: (payload: AdmissionInput) => Promise<void> | void;
  onCancel?: () => void;
  submitting?: boolean;
}

function todayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const destOptions: { value: DischargeDestination; label: string }[] = [
  { value: "dormitory", label: "กลับเรือนนอน" },
  { value: "home", label: "กลับบ้าน" },
  { value: "hospital", label: "ส่งต่อโรงพยาบาล" },
  { value: "other", label: "อื่นๆ" },
];

export default function AdmissionForm({
  onSubmit,
  onCancel,
  submitting,
}: AdmissionFormProps) {
  const [student, setStudent] = useState<Student | null>(null);
  const [admitDate, setAdmitDate] = useState(todayDate());
  const [admitTime, setAdmitTime] = useState(nowTime());
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [hasDischarge, setHasDischarge] = useState(false);
  const [dischargeDate, setDischargeDate] = useState(todayDate());
  const [dischargeTime, setDischargeTime] = useState(nowTime());
  const [dischargeDestination, setDischargeDestination] =
    useState<DischargeDestination>("dormitory");
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
      admitDate,
      admitTime,
      chiefComplaint,
      dischargeDate: hasDischarge ? dischargeDate : null,
      dischargeTime: hasDischarge ? dischargeTime : null,
      dischargeDestination: hasDischarge ? dischargeDestination : null,
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
          <label className="label">วันที่ admit *</label>
          <input
            type="date"
            className="input"
            value={admitDate}
            onChange={(e) => setAdmitDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">เวลา admit *</label>
          <input
            type="time"
            className="input"
            value={admitTime}
            onChange={(e) => setAdmitTime(e.target.value)}
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

      <div className="card-pad bg-ksp-blue-50/50 border border-ksp-blue-100">
        <label className="flex items-center gap-2 text-sm font-medium text-ksp-navy">
          <input
            type="checkbox"
            checked={hasDischarge}
            onChange={(e) => setHasDischarge(e.target.checked)}
            className="h-4 w-4 rounded border-ksp-blue-200"
          />
          จำหน่ายแล้ว (กรอกวันที่ และจุดหมายปลายทาง)
        </label>

        {hasDischarge && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">วันที่จำหน่าย *</label>
              <input
                type="date"
                className="input"
                value={dischargeDate}
                onChange={(e) => setDischargeDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">เวลา *</label>
              <input
                type="time"
                className="input"
                value={dischargeTime}
                onChange={(e) => setDischargeTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">จำหน่ายไปที่ *</label>
              <select
                className="input"
                value={dischargeDestination}
                onChange={(e) =>
                  setDischargeDestination(
                    e.target.value as DischargeDestination,
                  )
                }
              >
                {destOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
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
          {submitting ? "กำลังบันทึก..." : "บันทึก admission"}
        </button>
      </div>
    </form>
  );
}
