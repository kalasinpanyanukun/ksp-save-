import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Edit3,
  Eye,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  Wind,
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
import type { Pm25Record } from "../types";
import { chartPalette } from "../theme/colors";
import {
  aqiInfo,
  averagePm25Points,
  currentMonthKey,
  formatThaiDate,
  formatThaiMonth,
  normalizePm25Points,
} from "../utils/pm25";
import { numberInputToNumber, numberInputToString } from "../utils/numberInput";

function todayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function makePointId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function PM25Page() {
  const toast = useToast();
  const navigate = useNavigate();
  const [records, setRecords] = useState<Pm25Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Pm25Record | null>(null);
  const [deleting, setDeleting] = useState<Pm25Record | null>(null);
  const monthKey = currentMonthKey();
  const monthLabel = formatThaiMonth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPm25({ month: monthKey });
      setRecords(data);
    } catch {
      toast("โหลดข้อมูล PM2.5 ไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  }, [monthKey, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const latest = records[0];
  const latestValue = latest ? Number(latest.pm25Value) : null;
  const latestPoints = latest ? normalizePm25Points(latest) : [];

  const chartData = useMemo(
    () =>
      [...records].reverse().map((record) => ({
        date: new Date(record.recordDate).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "short",
        }),
        value: Number(record.pm25Value),
        pointCount: normalizePm25Points(record).length,
      })),
    [records],
  );

  const pdfRows = useMemo(
    () =>
      [...records].reverse().map((record) => {
        const points = normalizePm25Points(record);
        return [
          formatThaiDate(record.recordDate),
          record.recordTime,
          Number(record.pm25Value).toFixed(2),
          points.length,
          aqiInfo[record.aqiLevel].label,
          record.notes ?? "-",
          record.recordedBy?.fullName ?? "-",
        ];
      }),
    [records],
  );

  return (
    <>
      <PageHeader
        title="PM 2.5"
        description={`ภาพรวมค่าฝุ่นประจำเดือน${monthLabel}, บันทึกได้หลายจุดต่อวัน`}
        actions={
          <>
            <PdfExportButton
              label="ส่งออกกราฟ PDF"
              getReport={() => ({
                title: "กราฟภาพรวมค่าฝุ่น PM 2.5",
                subtitle: `ประจำเดือน${monthLabel}`,
                orientation: "l",
                fontSize: 11,
                chart: {
                  title: `แนวโน้มค่าเฉลี่ย PM2.5 ประจำเดือน${monthLabel}`,
                  yLabel: "µg/m³",
                  points: chartData.map((point) => ({
                    label: point.date,
                    value: point.value,
                  })),
                  threshold: { value: 50, label: "เกณฑ์เริ่มอันตราย 50" },
                },
                columns: [
                  { header: "วันที่", weight: 1.1 },
                  { header: "เวลา", weight: 0.7 },
                  { header: "ค่าเฉลี่ย PM2.5", weight: 1.1 },
                  { header: "จำนวนจุด", weight: 0.8 },
                  { header: "ระดับ AQI", weight: 1.6 },
                  { header: "หมายเหตุ", weight: 1.8 },
                  { header: "ผู้บันทึก", weight: 1.2 },
                ],
                rows: pdfRows,
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
        <div className="card-pad mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div
            className="grid h-16 w-16 place-items-center rounded-2xl text-xl font-bold text-white"
            style={{ backgroundColor: aqiInfo[latest.aqiLevel].color }}
          >
            {latestValue.toFixed(0)}
          </div>
          <div className="w-full flex-1 text-center sm:text-left">
            <div className="text-sm text-ksp-gray">ค่าเฉลี่ยล่าสุด (µg/m³)</div>
            <div className="text-2xl font-bold text-ksp-navy">
              {latestValue.toFixed(2)}
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className={`chip ${aqiInfo[latest.aqiLevel].chip}`}>
                {aqiInfo[latest.aqiLevel].label}
              </span>
              <span className="chip-blue">
                {latestPoints.length.toLocaleString("th-TH")} จุดวัด
              </span>
            </div>
            <div className="mt-1 text-xs text-ksp-gray">
              วัดเมื่อ {formatThaiDate(latest.recordDate)} · {latest.recordTime}
            </div>
          </div>
          {latestValue > 50 && (
            <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:w-auto sm:justify-start">
              <AlertTriangle className="h-4 w-4" />
              ค่าสูง ควรระมัดระวังกิจกรรมกลางแจ้ง
            </div>
          )}
        </div>
      )}

      <div className="card-pad mb-4">
        <h3 className="mb-3 font-semibold text-ksp-navy">
          แนวโน้มค่าเฉลี่ยเดือน{monthLabel}
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
                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toFixed(2)} µg/m³`,
                    "ค่าเฉลี่ย",
                  ]}
                  labelFormatter={(label) => `วันที่ ${label}`}
                />
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
                <th>ค่าเฉลี่ย PM2.5 (µg/m³)</th>
                <th>จำนวนจุดที่วัด</th>
                <th>ระดับ AQI</th>
                <th>หมายเหตุ</th>
                <th>ผู้บันทึก</th>
                <th className="text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="py-6 text-center">
                    <Loader2 className="inline h-5 w-5 animate-spin text-ksp-blue-500" />
                  </td>
                </tr>
              )}
              {!loading &&
                records.map((record) => {
                  const aqi = aqiInfo[record.aqiLevel];
                  const points = normalizePm25Points(record);
                  return (
                    <tr
                      key={record.id}
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer transition-colors hover:bg-ksp-blue-50/40"
                      onClick={() => navigate(`/pm25/${record.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(`/pm25/${record.id}`);
                        }
                      }}
                    >
                      <td>{formatThaiDate(record.recordDate)}</td>
                      <td>{record.recordTime}</td>
                      <td className="font-medium">{Number(record.pm25Value).toFixed(2)}</td>
                      <td>
                        <span className="chip-blue">
                          {points.length.toLocaleString("th-TH")} จุด
                        </span>
                      </td>
                      <td>
                        <span className={`chip ${aqi.chip}`}>{aqi.label}</span>
                      </td>
                      <td className="max-w-[24ch] truncate">{record.notes ?? "-"}</td>
                      <td className="text-xs text-ksp-gray">
                        {record.recordedBy?.fullName ?? "-"}
                      </td>
                      <td className="text-right">
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            className="btn-ghost px-2 py-1.5"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/pm25/${record.id}`);
                            }}
                            title="ดูรายละเอียด"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="btn-ghost px-2 py-1.5"
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditing(record);
                              setOpen(true);
                            }}
                            title="แก้ไข"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="btn-ghost px-2 py-1.5 text-rose-600 hover:bg-rose-50"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleting(record);
                            }}
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
              title="ยังไม่มีบันทึก PM2.5"
              description="กดปุ่มบันทึกค่าใหม่เพื่อเริ่มเก็บข้อมูลหลายจุดวัด"
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
        title={editing ? "แก้ไขค่า PM2.5" : "บันทึกค่า PM2.5"}
        size="lg"
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
              toast(editing ? "แก้ไขค่า PM2.5 เรียบร้อย" : "บันทึกค่า PM2.5 เรียบร้อย", "success");
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
        message={`ต้องการลบบันทึก PM2.5 วันที่ ${deleting ? formatThaiDate(deleting.recordDate) : ""} เวลา ${deleting?.recordTime ?? ""}?`}
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

interface EditablePm25Point {
  id: string;
  location: string;
  pm25Value: string;
}

function editablePoints(initial?: Pm25Record | null): EditablePm25Point[] {
  if (!initial) {
    return [{ id: makePointId(), location: "จุดวัดหลัก", pm25Value: "" }];
  }
  return normalizePm25Points(initial).map((point) => ({
    id: point.id || makePointId(),
    location: point.location,
    pm25Value: numberInputToString(point.pm25Value),
  }));
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
  const [points, setPoints] = useState<EditablePm25Point[]>(() => editablePoints(initial));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const average = averagePm25Points(points);

  function updatePoint(index: number, next: Partial<EditablePm25Point>) {
    setPoints((current) =>
      current.map((point, pointIndex) =>
        pointIndex === index ? { ...point, ...next } : point,
      ),
    );
  }

  function addPoint() {
    setPoints((current) => [
      ...current,
      {
        id: makePointId(),
        location: `จุดที่ ${current.length + 1}`,
        pm25Value: "",
      },
    ]);
  }

  function removePoint(index: number) {
    setPoints((current) => current.filter((_, pointIndex) => pointIndex !== index));
  }

  async function handle(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const measurementPoints = points.map((point) => ({
        id: point.id,
        location: point.location.trim(),
        pm25Value: numberInputToNumber(point.pm25Value),
      }));
      await onSubmit({
        recordDate,
        recordTime,
        pm25Value: average,
        measurementPoints,
        notes: notes.trim() || null,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handle} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

      <div className="rounded-xl border border-ksp-blue-100 bg-ksp-blue-50/40 px-3 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-semibold text-ksp-navy">จุดที่วัด</div>
            <div className="text-xs text-ksp-gray">
              ค่าเฉลี่ย: <span className="font-semibold text-ksp-blue-700">{average.toFixed(2)} µg/m³</span> จาก {points.length.toLocaleString("th-TH")} จุด
            </div>
          </div>
          <button
            type="button"
            className="btn-outline px-3 py-2"
            onClick={addPoint}
            disabled={points.length >= 30}
          >
            <Plus className="h-4 w-4" /> เพิ่มจุด
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {points.map((point, index) => (
            <div
              key={point.id}
              className="grid grid-cols-1 gap-2 rounded-lg border border-white bg-white p-2 sm:grid-cols-[minmax(0,1fr)_9rem_auto]"
            >
              <div>
                <label className="label">ชื่อสถานที่ *</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ksp-gray" />
                  <input
                    className="input pl-9"
                    value={point.location}
                    onChange={(e) => updatePoint(index, { location: e.target.value })}
                    placeholder="เช่น หน้าอาคารเรียน"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">ค่า PM2.5 *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  value={point.pm25Value}
                  onChange={(e) => updatePoint(index, { pm25Value: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  className="btn-ghost w-full px-3 py-2 text-rose-600 hover:bg-rose-50 sm:w-auto"
                  onClick={() => removePoint(index)}
                  disabled={points.length === 1}
                  title="ลบจุดวัด"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sm:hidden">ลบจุด</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="label">หมายเหตุ</label>
        <textarea
          className="input min-h-[70px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap justify-end gap-2 pt-2 max-sm:[&_button]:w-full">
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
