import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Wind,
  Plus,
  Loader2,
  AlertTriangle,
  Edit3,
  Trash2,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import PdfExportButton from "../components/common/PdfExportButton";
import { useToast } from "../components/common/useToast";
import {
  createPm25,
  deletePm25,
  listPm25,
  updatePm25,
  type Pm25Input,
} from "../services/pm25Service";
import type { AqiLevel, Pm25Record } from "../types";
import { chartPalette } from "../theme/colors";

const aqiInfo: Record<AqiLevel, { label: string; color: string; chip: string }> = {
  good: { label: "ดี", color: "#22c55e", chip: "bg-emerald-100 text-emerald-700" },
  moderate: { label: "ปานกลาง", color: "#eab308", chip: "bg-amber-100 text-amber-700" },
  unhealthy_sensitive: {
    label: "เริ่มมีผลต่อผู้ที่ไวต่อมลพิษ",
    color: "#f59e0b",
    chip: "bg-orange-100 text-orange-700",
  },
  unhealthy: {
    label: "มีผลต่อสุขภาพ",
    color: "#ef4444",
    chip: "bg-rose-100 text-rose-700",
  },
  very_unhealthy: {
    label: "มีผลต่อสุขภาพมาก",
    color: "#a855f7",
    chip: "bg-purple-100 text-purple-700",
  },
  hazardous: {
    label: "อันตราย",
    color: "#7f1d1d",
    chip: "bg-rose-200 text-rose-900",
  },
};

function todayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function PM25Page() {
  const toast = useToast();
  const [records, setRecords] = useState<Pm25Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Pm25Record | null>(null);
  const [deleting, setDeleting] = useState<Pm25Record | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPm25(30);
      setRecords(data);
    } catch {
      toast("โหลดข้อมูล PM2.5 ไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const latest = records[0];
  const latestValue = latest ? Number(latest.pm25Value) : null;

  const chartData = useMemo(
    () =>
      [...records]
        .reverse()
        .slice(-30)
        .map((r) => ({
          date: new Date(r.recordDate).toLocaleDateString("th-TH", {
            day: "2-digit",
            month: "short",
          }),
          value: Number(r.pm25Value),
        })),
    [records],
  );

  return (
    <>
      <PageHeader
        title="PM 2.5"
        description="บันทึกและติดตามค่าฝุ่นละอองรายวัน (30 วันล่าสุด)"
        actions={
          <>
            <PdfExportButton
              getReport={() => ({
                title: "รายงานค่าฝุ่น PM 2.5",
                subtitle: "ข้อมูล 30 วันล่าสุด",
                fontSize: 14,
                columns: [
                  { header: "วันที่", weight: 1.2 },
                  { header: "เวลา", weight: 0.8 },
                  { header: "ค่า PM2.5", weight: 1 },
                  { header: "ระดับ AQI", weight: 1.6 },
                  { header: "หมายเหตุ", weight: 2 },
                  { header: "ผู้บันทึก", weight: 1.4 },
                ],
                rows: records.map((r) => [
                  new Date(r.recordDate).toLocaleDateString("th-TH"),
                  r.recordTime,
                  Number(r.pm25Value).toFixed(2),
                  aqiInfo[r.aqiLevel].label,
                  r.notes ?? "-",
                  r.recordedBy?.fullName ?? "-",
                ]),
              })}
            />
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> บันทึกค่าใหม่
            </button>
          </>
        }
      />

      {latest && latestValue !== null && (
        <div className="card-pad mb-4 flex items-center gap-4">
          <div
            className="grid h-16 w-16 place-items-center rounded-2xl text-white font-bold text-xl"
            style={{ backgroundColor: aqiInfo[latest.aqiLevel].color }}
          >
            {latestValue.toFixed(0)}
          </div>
          <div className="flex-1">
            <div className="text-sm text-ksp-gray">ค่าล่าสุด (µg/m³)</div>
            <div className="text-2xl font-bold text-ksp-navy">
              {latestValue.toFixed(2)}
            </div>
            <div className={`chip mt-1 ${aqiInfo[latest.aqiLevel].chip}`}>
              {aqiInfo[latest.aqiLevel].label}
            </div>
            <div className="text-xs text-ksp-gray mt-1">
              วัดเมื่อ {new Date(latest.recordDate).toLocaleDateString("th-TH")} ·{" "}
              {latest.recordTime}
            </div>
          </div>
          {latestValue > 50 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              <AlertTriangle className="h-4 w-4" />
              ค่าสูง — ควรระมัดระวังกิจกรรมกลางแจ้ง
            </div>
          )}
        </div>
      )}

      <div className="card-pad mb-4">
        <h3 className="font-semibold text-ksp-navy mb-3">
          แนวโน้ม 30 วันล่าสุด
        </h3>
        {chartData.length === 0 ? (
          <p className="text-sm text-ksp-gray">ไม่มีข้อมูล</p>
        ) : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5EDF7" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <ReferenceLine
                  y={50}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: "เกณฑ์เริ่มอันตราย 50", position: "right", fontSize: 10 }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={chartPalette[0]}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>วันที่</th>
                <th>เวลา</th>
                <th>ค่า PM2.5 (µg/m³)</th>
                <th>ระดับ AQI</th>
                <th>หมายเหตุ</th>
                <th>ผู้บันทึก</th>
                <th className="text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center py-6">
                    <Loader2 className="inline h-5 w-5 animate-spin text-ksp-blue-500" />
                  </td>
                </tr>
              )}
              {!loading &&
                records.map((r) => {
                  const aqi = aqiInfo[r.aqiLevel];
                  return (
                    <tr key={r.id}>
                      <td>{new Date(r.recordDate).toLocaleDateString("th-TH")}</td>
                      <td>{r.recordTime}</td>
                      <td className="font-medium">{Number(r.pm25Value).toFixed(2)}</td>
                      <td>
                        <span className={`chip ${aqi.chip}`}>{aqi.label}</span>
                      </td>
                      <td className="max-w-[24ch] truncate">{r.notes ?? "-"}</td>
                      <td className="text-xs text-ksp-gray">
                        {r.recordedBy?.fullName ?? "-"}
                      </td>
                      <td className="text-right">
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            className="btn-ghost px-2 py-1.5"
                            onClick={() => {
                              setEditing(r);
                              setOpen(true);
                            }}
                            title="แก้ไข"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="btn-ghost px-2 py-1.5 text-rose-600 hover:bg-rose-50"
                            onClick={() => setDeleting(r)}
                            title="ลบ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        {!loading && records.length === 0 && (
          <div className="p-6">
            <EmptyState
              icon={<Wind className="h-7 w-7" />}
              title="ยังไม่มีบันทึก PM 2.5"
              description="กดปุ่ม 'บันทึกค่าใหม่' เพื่อเริ่มเก็บข้อมูล"
            />
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing ? "แก้ไขค่า PM 2.5" : "บันทึกค่า PM 2.5"}
        size="md"
      >
        <PM25Form
          initial={editing}
          onCancel={() => {
            setOpen(false);
            setEditing(null);
          }}
          onSubmit={async (payload) => {
            try {
              if (editing) await updatePm25(editing.id, payload);
              else await createPm25(payload);
              toast(editing ? "แก้ไขค่า PM 2.5 เรียบร้อย" : "บันทึกค่า PM 2.5 เรียบร้อย", "success");
              setOpen(false);
              setEditing(null);
              await load();
            } catch (err) {
              const m =
                (err as { response?: { data?: { message?: string } } })?.response
                  ?.data?.message ?? "บันทึกไม่สำเร็จ";
              toast(m, "error");
            }
          }}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="ยืนยันการลบ"
        message={`ต้องการลบบันทึก PM 2.5 วันที่ ${deleting ? new Date(deleting.recordDate).toLocaleDateString("th-TH") : ""} เวลา ${deleting?.recordTime ?? ""}?`}
        danger
        confirmLabel="ลบ"
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deletePm25(deleting.id);
            toast("ลบเรียบร้อย", "success");
            await load();
          } catch {
            toast("ลบไม่สำเร็จ", "error");
          } finally {
            setDeleting(null);
          }
        }}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

function isoDate(value: string) {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function PM25Form({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Pm25Record | null;
  onSubmit: (payload: Pm25Input) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [recordDate, setRecordDate] = useState(initial ? isoDate(initial.recordDate) : todayDate());
  const [recordTime, setRecordTime] = useState(initial?.recordTime ?? nowTime());
  const [pm25Value, setPm25Value] = useState<number>(initial ? Number(initial.pm25Value) : 0);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handle(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ recordDate, recordTime, pm25Value, notes: notes || null });
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <form onSubmit={handle} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">วันที่ *</label>
          <input
            type="date"
            className="input"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">เวลา *</label>
          <input
            type="time"
            className="input"
            value={recordTime}
            onChange={(e) => setRecordTime(e.target.value)}
            required
          />
        </div>
      </div>
      <div>
        <label className="label">ค่า PM 2.5 (µg/m³) *</label>
        <input
          type="number"
          step="0.01"
          min="0"
          className="input"
          value={pm25Value}
          onChange={(e) => setPm25Value(Number(e.target.value))}
          required
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
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-outline" onClick={onCancel}>
          ยกเลิก
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </form>
  );
}
