import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search, Info } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import PdfExportButton from "../components/common/PdfExportButton";
import { useToast } from "../components/common/useToast";
import {
  getHealthReport,
  type HealthReport,
  type HealthReportType,
} from "../services/healthReportsService";

const TINTS = [
  "bg-sky-100",
  "bg-emerald-100",
  "bg-violet-100",
  "bg-amber-100",
  "bg-rose-100",
  "bg-teal-100",
];
const tint = (i: number) => TINTS[i % TINTS.length];

const THAI_MONTHS: Record<string, number> = {
  "ม.ค.": 1, มกราคม: 1, "ก.พ.": 2, กุมภาพันธ์: 2, "มี.ค.": 3, มีนาคม: 3,
  "เม.ย.": 4, เมษายน: 4, "พ.ค.": 5, พฤษภาคม: 5, "มิ.ย.": 6, มิถุนายน: 6,
  "ก.ค.": 7, กรกฎาคม: 7, "ส.ค.": 8, สิงหาคม: 8, "ก.ย.": 9, กันยายน: 9,
  "ต.ค.": 10, ตุลาคม: 10, "พ.ย.": 11, พฤศจิกายน: 11, "ธ.ค.": 12, ธันวาคม: 12,
};

/** parse วันที่ไทย เช่น "1 มิ.ย. 2569", "01/06/2569", "1/6/69" -> Date | null */
function parseThaiDate(text: string): Date | null {
  const t = text.trim();
  if (!t) return null;
  const slash = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slash) {
    let [, d, m, y] = slash.map(Number) as unknown as number[];
    if (y! < 100) y! += 2500;
    if (y! > 2400) y! -= 543;
    const dt = new Date(y!, m! - 1, d!);
    return isNaN(dt.getTime()) ? null : dt;
  }
  const m2 = t.match(/(\d{1,2})\s*([ก-๙.]+)\s*(\d{2,4})/);
  if (m2) {
    const d = Number(m2[1]);
    let y = Number(m2[3]);
    const mon = THAI_MONTHS[m2[2]!.trim()];
    if (!mon) return null;
    if (y < 100) y += 2500;
    if (y > 2400) y -= 543;
    const dt = new Date(y, mon - 1, d);
    return isNaN(dt.getTime()) ? null : dt;
  }
  return null;
}

function nutritionTone(result: string): string {
  if (/ผอม|น้อยกว่า/.test(result)) return "bg-amber-50";
  if (/อ้วน/.test(result)) return "bg-rose-50";
  if (/ท้วม|เกิน/.test(result)) return "bg-orange-50";
  if (/ปกติ|สมส่วน/.test(result)) return "bg-emerald-50";
  return "bg-sky-50";
}

export default function HealthReportPage({ type }: { type: HealthReportType }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [report, setReport] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReport(await getHealthReport(type));
    } catch {
      toast("โหลดรายงานไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  }, [type, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const all = report?.rows ?? [];
    const k = q.trim().toLowerCase();
    if (!k) return all;
    return all.filter((r) => r.cells.some((c) => c.toLowerCase().includes(k)));
  }, [report, q]);

  // ดัชนีคอลัมน์สำหรับระบายสีแถว
  const evalIdx = report?.columns.findIndex((c) => c.header.includes("ประเมินผล")) ?? -1;
  const nextIdx = report?.columns.findIndex((c) => c.header.includes("นัดครั้งถัดไป")) ?? -1;

  function rowTone(cells: string[]): string {
    if (type === "nutrition" && evalIdx >= 0) return nutritionTone(cells[evalIdx] ?? "");
    if (type === "injection" && nextIdx >= 0) {
      const dt = parseThaiDate(cells[nextIdx] ?? "");
      if (dt) {
        const days = (dt.getTime() - Date.now()) / 86400000;
        if (days <= 7) return "bg-orange-100"; // นัดใกล้ถึง/เลยกำหนด
      }
    }
    return "";
  }

  return (
    <div className="relative left-1/2 w-[calc(100vw-2rem)] -translate-x-1/2 lg:w-[calc(100vw-18rem-2rem)]">
      <PageHeader
        title={report?.title ?? "รายงานสุขภาพ"}
        description={`${rows.length.toLocaleString("th-TH")} รายการ`}
        actions={
          report ? (
            <PdfExportButton
              getReport={() => ({
                title: report.title,
                subtitle: `ทั้งหมด ${rows.length} รายการ`,
                orientation: "l",
                fontSize: 12,
                columns: [{ header: "ลำดับ", weight: 0.4 }, ...report.columns],
                rows: rows.map((r, i) => [i + 1, ...r.cells]),
              })}
            />
          ) : undefined
        }
      />

      {/* แถวสรุป (ด้านหน้า) + ช่องค้นหา (ขวา) */}
      <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {report?.summary?.map((s) => (
            <span
              key={s.label}
              className="rounded-xl border border-ksp-blue-100 bg-white px-3 py-1.5 text-sm font-semibold text-ksp-navy shadow-card"
            >
              {s.label}: <span className="text-ksp-blue-600">{s.value}</span>
            </span>
          ))}
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ksp-gray" />
          <input
            className="input pl-9"
            placeholder="ค้นหาในตาราง"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        {loading && (
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2 text-xs text-ksp-gray">
            <Loader2 className="h-4 w-4 animate-spin text-ksp-blue-500" /> กำลังโหลด…
          </div>
        )}
        {!loading && rows.length === 0 ? (
          <div className="p-6">
            <EmptyState title="ยังไม่มีข้อมูล" description="ยังไม่พบนักเรียนในรายงานนี้" />
          </div>
        ) : (
          <div className="max-h-[calc(100vh-17rem)] overflow-auto">
            <table className="w-full border-collapse text-center text-xs">
              <thead>
                <tr>
                  <th className="sticky top-0 z-10 border-b-2 border-r border-slate-300 bg-slate-200 px-3 py-2.5 font-bold text-ksp-navy">
                    ลำดับ
                  </th>
                  {report?.columns.map((c, i) => (
                    <th
                      key={`${c.header}-${i}`}
                      className={`sticky top-0 z-10 whitespace-nowrap border-b-2 border-r border-slate-300 px-3 py-2.5 font-bold text-ksp-navy last:border-r-0 ${tint(i)}`}
                    >
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr
                    key={r.studentId + idx}
                    onClick={() => navigate(`/patients/${r.studentId}`)}
                    className={`cursor-pointer transition-shadow hover:shadow-[inset_3px_0_0_0_#4B98EC] ${rowTone(r.cells)}`}
                  >
                    <td className="border-b border-r border-slate-100 px-3 py-2.5 font-semibold text-ksp-navy">
                      {idx + 1}
                    </td>
                    {r.cells.map((cell, i) => (
                      <td
                        key={i}
                        className={`border-b border-r border-slate-100 px-3 py-2.5 last:border-r-0 ${
                          report?.columns[i] && (report.columns[i]!.weight ?? 1) >= 1.6
                            ? "min-w-[12rem] whitespace-normal text-left align-top leading-relaxed"
                            : "whitespace-nowrap align-middle"
                        } ${i === 0 || report?.columns[i]?.header.includes("ชื่อ-สกุล") ? "font-semibold text-ksp-blue-700" : "text-ksp-navy/85"}`}
                      >
                        {cell || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {report?.criteria && report.criteria.length > 0 && (
        <div className="mt-3 flex gap-2 rounded-xl border border-ksp-blue-100 bg-ksp-blue-50/60 px-4 py-2.5 text-sm text-ksp-navy">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-ksp-blue-600" />
          <div>
            <p className="font-semibold">เกณฑ์การวัด / หมายเหตุ</p>
            {report.criteria.map((c, i) => (
              <p key={i} className="text-xs text-ksp-navy/80">
                {c}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
