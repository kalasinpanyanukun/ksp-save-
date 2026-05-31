import { useState, type FormEvent } from "react";
import type { DischargeDestination } from "../../types";

interface DischargeFormProps {
  defaultDate?: string;
  defaultTime?: string;
  onSubmit: (payload: {
    dischargeDate: string;
    dischargeTime: string;
    dischargeDestination: DischargeDestination;
    notes?: string | null;
  }) => Promise<void> | void;
  onCancel?: () => void;
  submitting?: boolean;
}

const destOptions: { value: DischargeDestination; label: string }[] = [
  { value: "dormitory", label: "กลับเรือนนอน" },
  { value: "home", label: "กลับบ้าน" },
  { value: "hospital", label: "ส่งต่อโรงพยาบาล" },
  { value: "other", label: "อื่นๆ" },
];

export default function DischargeForm({
  defaultDate,
  defaultTime,
  onSubmit,
  onCancel,
  submitting,
}: DischargeFormProps) {
  const now = new Date();
  const [dischargeDate, setDischargeDate] = useState(
    defaultDate ??
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
  );
  const [dischargeTime, setDischargeTime] = useState(
    defaultTime ??
      `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
  );
  const [dischargeDestination, setDischargeDestination] =
    useState<DischargeDestination>("dormitory");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSubmit({
      dischargeDate,
      dischargeTime,
      dischargeDestination,
      notes: notes || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              setDischargeDestination(e.target.value as DischargeDestination)
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
      <div>
        <label className="label">หมายเหตุ</label>
        <textarea
          className="input min-h-[60px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap justify-end gap-2 pt-2 max-sm:[&_button]:w-full">
        {onCancel && (
          <button type="button" className="btn-outline" onClick={onCancel}>
            ยกเลิก
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "กำลังบันทึก..." : "บันทึกการจำหน่าย"}
        </button>
      </div>
    </form>
  );
}
