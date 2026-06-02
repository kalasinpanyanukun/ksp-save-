import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Wind } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHeader";
import PdfExportButton from "../components/common/PdfExportButton";
import { useToast } from "../components/common/useToast";
import { getPm25 } from "../services/pm25Service";
import type { Pm25Record } from "../types";
import {
  aqiFromPm25Value,
  aqiInfo,
  formatThaiDate,
  normalizePm25Points,
} from "../utils/pm25";

export default function PM25DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [record, setRecord] = useState<Pm25Record | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setRecord(await getPm25(id));
    } catch {
      toast("โหลดรายละเอียด PM2.5 ไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="card-pad flex items-center gap-2 text-sm text-ksp-gray">
        <Loader2 className="h-4 w-4 animate-spin text-ksp-blue-500" />
        กำลังโหลดรายละเอียด PM2.5
      </div>
    );
  }

  if (!record) {
    return (
      <div className="card-pad">
        <EmptyState
          icon={<Wind className="h-7 w-7" />}
          title="ไม่พบบันทึก PM2.5"
          description="กลับไปหน้ารวมเพื่อเลือกบันทึกอีกครั้ง"
          action={
            <button type="button" className="btn-primary" onClick={() => navigate("/pm25")}>
              กลับหน้ารวม
            </button>
          }
        />
      </div>
    );
  }

  const points = normalizePm25Points(record);
  const average = Number(record.pm25Value);
  const aqi = aqiInfo[record.aqiLevel];
  const chartData = points.map((point, index) => ({
    label: point.location,
    shortLabel: point.location.length > 12 ? `${point.location.slice(0, 12)}…` : point.location,
    value: point.pm25Value,
    quality: aqiFromPm25Value(point.pm25Value),
    order: index + 1,
  }));

  return (
    <>
      <PageHeader
        title={`รายละเอียด PM2.5 วันที่ ${formatThaiDate(record.recordDate)}`}
        description={`เวลา ${record.recordTime}, ค่าเฉลี่ย ${average.toFixed(2)} µg/m³ จาก ${points.length.toLocaleString("th-TH")} จุดวัด`}
        actions={
          <>
            <button type="button" className="btn-outline" onClick={() => navigate("/pm25")}>
              <ArrowLeft className="h-4 w-4" /> กลับหน้ารวม
            </button>
            <PdfExportButton
              label="ส่งออกเฉพาะวัน"
              getReport={() => ({
                title: "รายละเอียดค่าฝุ่น PM2.5 รายวัน",
                subtitle: `วันที่ ${formatThaiDate(record.recordDate)} เวลา ${record.recordTime}, ค่าเฉลี่ย ${average.toFixed(2)} µg/m³, ผู้บันทึก ${record.recordedBy?.fullName ?? "-"}`,
                orientation: "l",
                fontSize: 12,
                chart: {
                  title: `ค่าฝุ่นแยกตามจุดวัด วันที่ ${formatThaiDate(record.recordDate)}`,
                  yLabel: "µg/m³",
                  points: points.map((point) => ({
                    label: point.location,
                    value: point.pm25Value,
                  })),
                  threshold: { value: 50, label: "เกณฑ์เริ่มอันตราย 50" },
                },
                columns: [
                  { header: "ลำดับ", weight: 0.5 },
                  { header: "สถานที่", weight: 2 },
                  { header: "ค่า PM2.5", weight: 1 },
                  { header: "คุณภาพอากาศ", weight: 1.4 },
                ],
                rows: points.map((point, index) => [
                  index + 1,
                  point.location,
                  point.pm25Value.toFixed(2),
                  aqiInfo[aqiFromPm25Value(point.pm25Value)].label,
                ]),
              })}
            />
          </>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="card-pad">
          <div className="text-sm text-ksp-gray">ค่าเฉลี่ย</div>
          <div className="mt-1 text-2xl font-bold text-ksp-navy">
            {average.toFixed(2)}
          </div>
          <div className="text-xs text-ksp-gray">µg/m³</div>
        </div>
        <div className="card-pad">
          <div className="text-sm text-ksp-gray">จำนวนจุดที่วัด</div>
          <div className="mt-1 text-2xl font-bold text-ksp-navy">
            {points.length.toLocaleString("th-TH")}
          </div>
          <div className="text-xs text-ksp-gray">จุด</div>
        </div>
        <div className="card-pad">
          <div className="text-sm text-ksp-gray">ระดับ AQI</div>
          <span className={`chip mt-2 ${aqi.chip}`}>{aqi.label}</span>
        </div>
        <div className="card-pad">
          <div className="text-sm text-ksp-gray">ผู้บันทึก</div>
          <div className="mt-1 font-semibold text-ksp-navy">
            {record.recordedBy?.fullName ?? "-"}
          </div>
          <div className="text-xs text-ksp-gray">{record.recordTime}</div>
        </div>
      </div>

      <div className="card-pad mb-4">
        <h3 className="mb-3 font-semibold text-ksp-navy">ค่าฝุ่นแยกตามจุดวัด</h3>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5EDF7" />
              <XAxis dataKey="shortLabel" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value) => [
                  `${Number(value).toFixed(2)} µg/m³`,
                  "ค่า PM2.5",
                ]}
                labelFormatter={(_, payload) => {
                  const item = payload?.[0]?.payload as { label?: string; quality?: keyof typeof aqiInfo } | undefined;
                  return item?.quality
                    ? `${item.label ?? ""} (${aqiInfo[item.quality].label})`
                    : item?.label ?? "";
                }}
              />
              <ReferenceLine
                y={50}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{ value: "เกณฑ์เริ่มอันตราย 50", position: "right", fontSize: 10 }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((item) => (
                  <Cell key={item.order} fill={aqiInfo[item.quality].color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <section className="mb-4 space-y-3">
        <h3 className="font-semibold text-ksp-navy">กราฟฟิคคุณภาพอากาศรายจุด</h3>
        <div className="space-y-3">
          {points.map((point, index) => {
            const quality = aqiFromPm25Value(point.pm25Value);
            const info = aqiInfo[quality];
            return (
              <div
                key={point.id}
                className="grid grid-cols-1 items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm md:grid-cols-[12rem_minmax(0,1fr)_11rem]"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <div
                    className="grid h-24 w-24 place-items-center rounded-full border-8 text-center shadow-sm"
                    style={{
                      backgroundColor: `${info.color}22`,
                      borderColor: `${info.color}55`,
                      color: info.color,
                    }}
                  >
                    <div>
                      <div className="text-2xl font-bold leading-none">
                        {Math.round(point.pm25Value)}
                      </div>
                      <div className="text-xs font-semibold">PM2.5</div>
                    </div>
                  </div>
                  <div className="text-center text-sm font-semibold text-ksp-navy">
                    {info.label}
                  </div>
                </div>
                <div className="min-w-0 text-center md:text-left">
                  <div className="text-sm font-semibold text-ksp-gray">
                    จุดที่ {index + 1}
                  </div>
                  <div className="mt-1 break-words text-lg font-bold text-ksp-navy">
                    {point.location}
                  </div>
                  <div className="mt-2 text-sm text-ksp-gray">
                    {formatThaiDate(record.recordDate)} · {record.recordTime} น.
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <div className="text-sm font-semibold text-ksp-navy">PM2.5</div>
                  <div className="mt-1 text-3xl font-bold" style={{ color: info.color }}>
                    {point.pm25Value.toFixed(1)}
                  </div>
                  <div className="text-sm font-semibold text-ksp-navy">µg/m³</div>
                  <div className="mt-1 text-xs text-ksp-gray">Avg 24Hr</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>สถานที่</th>
                <th>ค่า PM2.5 (µg/m³)</th>
                <th>คุณภาพอากาศ</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point, index) => {
                const quality = aqiFromPm25Value(point.pm25Value);
                const info = aqiInfo[quality];
                return (
                  <tr key={point.id}>
                    <td>{index + 1}</td>
                    <td className="font-medium text-ksp-navy">{point.location}</td>
                    <td className="font-semibold" style={{ color: info.color }}>
                      {point.pm25Value.toFixed(2)}
                    </td>
                    <td>
                      <span className={`chip ${info.chip}`}>{info.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {record.notes && (
          <div className="border-t border-slate-100 px-4 py-3 text-sm text-ksp-navy">
            <span className="font-semibold">หมายเหตุ:</span> {record.notes}
          </div>
        )}
      </div>
    </>
  );
}
