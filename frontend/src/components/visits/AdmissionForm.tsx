import { useEffect, useState, type FormEvent } from "react";
import StudentPicker from "../patients/StudentPicker";
import type { Admission, DischargeDestination, Student } from "../../types";
import type { AdmissionInput } from "../../services/visitsService";

interface AdmissionFormProps {
  initial?: Admission | null;
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

function inputDate(value?: string | Date | null): string {
  if (!value) return todayDate();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return todayDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const destOptions: { value: DischargeDestination; label: string }[] = [
  { value: "dormitory", label: "กลับเรือนนอน" },
  { value: "home", label: "กลับบ้าน" },
  { value: "hospital", label: "ส่งต่อโรงพยาบาล" },
  { value: "other", label: "อื่นๆ" },
];

export default function AdmissionForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: AdmissionFormProps) {
  const [student, setStudent] = useState<Student | null>(initial?.student ?? null);
  const [admitDate, setAdmitDate] = useState(inputDate(initial?.admitDate));
  const [admitTime, setAdmitTime] = useState(initial?.admitTime ?? nowTime());
  const [chiefComplaint, setChiefComplaint] = useState(initial?.chiefComplaint ?? "");
  const [hasDischarge, setHasDischarge] = useState(Boolean(initial?.dischargeDate));
  const [dischargeDate, setDischargeDate] = useState(inputDate(initial?.dischargeDate));
  const [dischargeTime, setDischargeTime] = useState(initial?.dischargeTime ?? nowTime());
  const [dischargeDestination, setDischargeDestination] =
    useState<DischargeDestination>(initial?.dischargeDestination ?? "dormitory");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStudent(initial?.student ?? null);
    setAdmitDate(inputDate(initial?.admitDate));
    setAdmitTime(initial?.admitTime ?? nowTime());
    setChiefComplaint(initial?.chiefComplaint ?? "");
    setHasDischarge(Boolean(initial?.dischargeDate));
    setDischargeDate(inputDate(initial?.dischargeDate));
    setDischargeTime(initial?.dischargeTime ?? nowTime());
    setDischargeDestination(initial?.dischargeDestination ?? "dormitory");
    setNotes(initial?.notes ?? "");
    setError(null);
  }, [initial]);

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
          {submitting ? "กำลังบันทึก..." : initial ? "บันทึกการแก้ไข" : "บันทึก admission"}
        </button>
      </div>
    </form>
  );
}
