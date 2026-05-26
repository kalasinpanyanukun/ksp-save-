import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  FileBarChart2,
  Download,
  Calendar,
  CalendarDays,
  Calendar as CalendarIcon,
  Loader2,
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import ReportHeader from "../components/reports/ReportHeader";
import { useToast } from "../components/common/useToast";
import { exportElementToPdf } from "../services/pdfService";
import {
  getDailyReport,
  getMonthlyReport,
  getYearlyReport,
  type DailyReport,
  type MonthlyReport,
  type YearlyReport,
} from "../services/reportsService";
import { chartPalette } from "../theme/colors";

type Tab = "daily" | "monthly" | "yearly";

function todayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const monthNames = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("daily");
  const [date, setDate] = useState(todayDate());
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [daily, setDaily] = useState<DailyReport | null>(null);
  const [monthly, setMonthly] = useState<MonthlyReport | null>(null);
  const [yearly, setYearly] = useState<YearlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        if (tab === "daily") {
          const d = await getDailyReport(date);
          if (!cancelled) setDaily(d);
        } else if (tab === "monthly") {
          const m = await getMonthlyReport(year, month);
          if (!cancelled) setMonthly(m);
        } else {
          const y = await getYearlyReport(year);
          if (!cancelled) setYearly(y);
        }
      } catch {
        if (!cancelled) toast("โหลดรายงานไม่สำเร็จ", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [tab, date, year, month, toast]);

  async function handleExport() {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const label =
        tab === "daily" ? date : tab === "monthly" ? `${year}-${String(month).padStart(2, "0")}` : `${year}`;
      await exportElementToPdf(reportRef.current, {
        filename: `KSP_SAVE_Report_${tab}_${label}.pdf`,
      });
      toast("ส่งออก PDF เรียบร้อย", "success");
    } catch {
      toast("ส่งออก PDF ไม่สำเร็จ", "error");
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="รายงาน & สถิติ"
        description="สรุปการใช้บริการเรือนพยาบาลในรูปแบบรายงานพร้อมส่งออก PDF"
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={handleExport}
            disabled={exporting || loading}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            ส่งออก PDF
          </button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <TabButton
          active={tab === "daily"}
          onClick={() => setTab("daily")}
          Icon={Calendar}
          label="รายวัน"
        />
        <TabButton
          active={tab === "monthly"}
          onClick={() => setTab("monthly")}
          Icon={CalendarDays}
          label="รายเดือน"
        />
        <TabButton
          active={tab === "yearly"}
          onClick={() => setTab("yearly")}
          Icon={CalendarIcon}
          label="รายปี"
        />
      </div>

      <div className="card-pad mb-4">
        {tab === "daily" && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-ksp-navy">วันที่:</label>
            <input
              type="date"
              className="input max-w-[200px]"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        )}
        {tab === "monthly" && (
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-ksp-navy">เดือน:</label>
            <select
              className="input max-w-[160px]"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {monthNames.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <input
              type="number"
              className="input max-w-[120px]"
              value={year}
              min={2020}
              max={2100}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
        )}
        {tab === "yearly" && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-ksp-navy">ปี:</label>
            <input
              type="number"
              className="input max-w-[120px]"
              value={year}
              min={2020}
              max={2100}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
        )}
      </div>

      <div ref={reportRef} className="bg-white rounded-2xl p-6 shadow-card">
        {loading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-ksp-blue-500" />
          </div>
        ) : tab === "daily" && daily ? (
          <DailySection report={daily} />
        ) : tab === "monthly" && monthly ? (
          <MonthlySection report={monthly} />
        ) : tab === "yearly" && yearly ? (
          <YearlySection report={yearly} />
        ) : (
          <div className="text-center py-10 text-ksp-gray text-sm">
            ไม่มีข้อมูล
          </div>
        )}
      </div>
    </>
  );
}

function TabButton({
  active,
  onClick,
  Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  Icon: typeof FileBarChart2;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn ${
        active
          ? "bg-ksp-blue-500 text-white"
          : "bg-white border border-ksp-blue-100 text-ksp-navy hover:bg-ksp-blue-50"
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function StatBlock({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl bg-ksp-blue-50 border border-ksp-blue-100 px-4 py-3">
      <div className="text-xs text-ksp-blue-700 font-medium">{label}</div>
      <div className="text-xl font-bold text-ksp-navy mt-0.5">{value}</div>
      {hint && <div className="text-[11px] text-ksp-gray">{hint}</div>}
    </div>
  );
}

function DailySection({ report }: { report: DailyReport }) {
  const dateText = new Date(report.date).toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <>
      <ReportHeader
        title="รายงานการใช้บริการเรือนพยาบาล (รายวัน)"
        dateRangeText={dateText}
      />
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatBlock label="OPD" value={report.totals.opd} hint="ครั้ง" />
        <StatBlock label="Admission" value={report.totals.admissions} hint="ราย" />
        <StatBlock label="Referral" value={report.totals.referrals} hint="ราย" />
      </div>

      <section className="mb-5">
        <h3 className="font-semibold text-ksp-navy mb-2">รายการ OPD</h3>
        {report.opdVisits.length === 0 ? (
          <p className="text-sm text-ksp-gray">ไม่มีบันทึก</p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>เวลา</th>
                <th>นักเรียน</th>
                <th>ชั้น</th>
                <th>อาการ</th>
                <th>การรักษา</th>
              </tr>
            </thead>
            <tbody>
              {report.opdVisits.map((v) => (
                <tr key={v.id}>
                  <td>{v.visitTime}</td>
                  <td>
                    {v.student?.firstName} {v.student?.lastName}
                  </td>
                  <td>{v.student?.classRoom ?? "-"}</td>
                  <td>{v.chiefComplaint}</td>
                  <td>{v.treatment ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="mb-5">
        <h3 className="font-semibold text-ksp-navy mb-2">Admission</h3>
        {report.admissions.length === 0 ? (
          <p className="text-sm text-ksp-gray">ไม่มีบันทึก</p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>นักเรียน</th>
                <th>ชั้น</th>
                <th>อาการ</th>
                <th>วันที่ admit</th>
                <th>วันที่ discharge</th>
                <th>จุดหมาย</th>
                <th>วัน</th>
              </tr>
            </thead>
            <tbody>
              {report.admissions.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.student?.firstName} {a.student?.lastName}
                  </td>
                  <td>{a.student?.classRoom ?? "-"}</td>
                  <td>{a.chiefComplaint}</td>
                  <td>{new Date(a.admitDate).toLocaleDateString("th-TH")}</td>
                  <td>
                    {a.dischargeDate
                      ? new Date(a.dischargeDate).toLocaleDateString("th-TH")
                      : "-"}
                  </td>
                  <td>{a.dischargeDestination ?? "-"}</td>
                  <td>{a.totalDays ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h3 className="font-semibold text-ksp-navy mb-2">Referral</h3>
        {report.referrals.length === 0 ? (
          <p className="text-sm text-ksp-gray">ไม่มีบันทึก</p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>นักเรียน</th>
                <th>ชั้น</th>
                <th>อาการ</th>
                <th>นำส่งที่</th>
              </tr>
            </thead>
            <tbody>
              {report.referrals.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.student?.firstName} {r.student?.lastName}
                  </td>
                  <td>{r.student?.classRoom ?? "-"}</td>
                  <td>{r.chiefComplaint}</td>
                  <td>{r.referredTo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

function MonthlySection({ report }: { report: MonthlyReport }) {
  const title = `รายงานประจำเดือน ${monthNames[report.month - 1]} ${report.year}`;
  return (
    <>
      <ReportHeader
        title="รายงานการใช้บริการเรือนพยาบาล (รายเดือน)"
        dateRangeText={title}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatBlock label="OPD" value={report.totals.opd} hint="ครั้ง" />
        <StatBlock label="Admission" value={report.totals.admissions} hint="ราย" />
        <StatBlock label="Referral" value={report.totals.referrals} hint="ราย" />
        <StatBlock
          label="วันนอนพักรวม"
          value={report.totals.admissionDays}
          hint="วัน"
        />
      </div>

      <section className="mb-6">
        <h3 className="font-semibold text-ksp-navy mb-2">OPD แยกตามวัน</h3>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={report.byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5EDF7" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill={chartPalette[0]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <section>
          <h3 className="font-semibold text-ksp-navy mb-2">
            อาการที่พบบ่อย (Top 10)
          </h3>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart
                data={report.topSymptoms}
                layout="vertical"
                margin={{ left: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5EDF7" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="symptom"
                  width={120}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar dataKey="count" fill={chartPalette[1]} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-ksp-navy mb-2">
            แยกตามชั้นเรียน
          </h3>
          <div className="border border-ksp-blue-50 rounded-xl overflow-hidden">
            <table className="table-base">
              <thead>
                <tr>
                  <th>ชั้นเรียน</th>
                  <th className="text-right">จำนวนครั้ง</th>
                </tr>
              </thead>
              <tbody>
                {report.byClass.map((c) => (
                  <tr key={c.classRoom}>
                    <td>{c.classRoom}</td>
                    <td className="text-right font-medium">{c.count}</td>
                  </tr>
                ))}
                {report.byClass.length === 0 && (
                  <tr>
                    <td colSpan={2} className="text-center py-4 text-ksp-gray">
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {report.byHospital.length > 0 && (
        <section>
          <h3 className="font-semibold text-ksp-navy mb-2">
            การส่งต่อแยกตามโรงพยาบาล
          </h3>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={report.byHospital}
                  dataKey="count"
                  nameKey="name"
                  outerRadius={90}
                  label={(d) => `${d.name}: ${d.count}`}
                >
                  {report.byHospital.map((_, i) => (
                    <Cell
                      key={i}
                      fill={chartPalette[i % chartPalette.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </>
  );
}

function YearlySection({ report }: { report: YearlyReport }) {
  const data = useMemo(
    () =>
      report.months.map((m) => ({
        ...m,
        monthLabel: monthNames[m.month - 1]!.substring(0, 3),
      })),
    [report.months],
  );
  return (
    <>
      <ReportHeader
        title="รายงานการใช้บริการเรือนพยาบาล (รายปี)"
        dateRangeText={`ปี ${report.year}`}
      />

      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatBlock label="OPD รวม" value={report.totals.opd} hint="ครั้ง" />
        <StatBlock label="Admission รวม" value={report.totals.admissions} hint="ราย" />
        <StatBlock label="Referral รวม" value={report.totals.referrals} hint="ราย" />
      </div>

      <section className="mb-6">
        <h3 className="font-semibold text-ksp-navy mb-2">
          แนวโน้มรายเดือน
        </h3>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5EDF7" />
              <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="opd"
                name="OPD"
                stroke={chartPalette[0]}
                strokeWidth={2.5}
              />
              <Line
                type="monotone"
                dataKey="admissions"
                name="Admission"
                stroke={chartPalette[2]}
                strokeWidth={2.5}
              />
              <Line
                type="monotone"
                dataKey="referrals"
                name="Referral"
                stroke={chartPalette[1]}
                strokeWidth={2.5}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-ksp-navy mb-2">
          สัดส่วน OPD / Admission / Referral
        </h3>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={[
                  { name: "OPD", value: report.totals.opd },
                  { name: "Admission", value: report.totals.admissions },
                  { name: "Referral", value: report.totals.referrals },
                ]}
                dataKey="value"
                outerRadius={90}
                label={(d) => `${d.name}: ${d.value}`}
              >
                {[0, 1, 2].map((i) => (
                  <Cell key={i} fill={chartPalette[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
}
