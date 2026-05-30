import {
  User,
  Calendar,
  Stethoscope,
  BedDouble,
  Send,
  ClipboardList,
  Pill,
  Activity,
  Home,
  NotebookText,
  HeartPulse,
  type LucideIcon,
} from "lucide-react";
import type { StudentDetail } from "../../services/studentsService";
import type { Admission } from "../../types";

const studentStatusLabel: Record<StudentDetail["studentStatus"], string> = {
  resident: "ประจำ",
  infirmary: "ป่วย(นอนเรือนบาล)",
  home_leave: "ลากลับบ้าน",
};

const MEAL_LABELS: { key: string; label: string; alt: string }[] = [
  { key: "เช้า", label: "เช้า", alt: "การรับประทาน เช้า" },
  { key: "เที่ยง", label: "เที่ยง", alt: "การรับประทาน เที่ยง" },
  { key: "เย็น", label: "เย็น", alt: "การรับประทาน เย็น" },
  { key: "ก่อนนอน", label: "ก่อนนอน", alt: "การรับประทาน ก่อนนอน" },
  { key: "นอกเวลา", label: "นอกเวลา", alt: "การรับประทาน นอกเวลา" },
];

export function formatDate(date: string | null | undefined) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return date;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatDetailValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return `${value.length.toLocaleString("th-TH")} รายการ`;
  if (typeof value === "object") return JSON.stringify(value);
  const text = String(value);
  if (text.toUpperCase() === "TRUE") return "✓";
  if (text.toUpperCase() === "FALSE") return "-";
  return text;
}

function valueFrom(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = data[key];
    if (value !== null && value !== undefined && value !== "") {
      return formatDetailValue(value);
    }
  }
  return "-";
}

function medText(med: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = med[key];
    const text = value === null || value === undefined ? "" : String(value).trim();
    if (text && text !== "-") return text;
  }
  return "";
}

/* ───────────────── Layout primitives ───────────────── */

function Field({
  label,
  value,
  wide,
}: {
  label: string;
  value: string | null | undefined;
  wide?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5 ${wide ? "sm:col-span-2" : ""}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-ksp-gray">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-ksp-navy">{value || "-"}</p>
    </div>
  );
}

function SectionCard({
  title,
  Icon,
  tone = "blue",
  children,
}: {
  title: string;
  Icon: typeof ClipboardList;
  tone?: "blue" | "rose" | "emerald" | "violet" | "amber";
  children: React.ReactNode;
}) {
  const toneClass = {
    blue: "bg-ksp-blue-50 text-ksp-blue-700",
    rose: "bg-rose-50 text-rose-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
  }[tone];
  const IconCmp = Icon as LucideIcon;
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-ksp-navy">
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${toneClass}`}>
          <IconCmp className="h-4 w-4" />
        </span>
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/* ───────────────── Medication list (shared) ───────────────── */

export function MedicationList({
  data,
  className,
}: {
  data: Record<string, unknown> | null | undefined;
  className?: string;
}) {
  const record = isPlainObject(data) ? data : {};
  const rows = Array.isArray(record["รายการยา"])
    ? (record["รายการยา"] as Record<string, unknown>[])
    : [];

  if (rows.length === 0) {
    return <p className="text-sm text-ksp-gray">ยังไม่มีข้อมูลยาประจำตัว</p>;
  }

  return (
    <div className={`grid grid-cols-1 gap-2.5 ${className ?? ""}`}>
      {rows.map((med, index) => {
        const name = medText(med, "ชื่อยา", "ข้อมูลยา ชื่อยา") || `ยาที่ ${index + 1}`;
        const secondary = medText(med, "ชื่อรอง", "ข้อมูลยา ชื่อรอง");
        const strength = medText(med, "ขนาดยา", "ข้อมูลยา ขนาดยา");
        const note = medText(med, "หมายเหตุ");
        const times = MEAL_LABELS.map((m) => ({
          label: m.label,
          value: medText(med, m.key, m.alt),
        })).filter((t) => t.value);
        return (
          <div
            key={index}
            className="rounded-xl border border-ksp-blue-100 bg-gradient-to-br from-white to-ksp-blue-50/30 p-3"
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-bold text-ksp-blue-700">{name}</span>
              {secondary && <span className="text-xs text-ksp-gray">({secondary})</span>}
              {strength && (
                <span className="rounded bg-white px-1.5 py-0.5 text-[11px] font-semibold text-ksp-navy ring-1 ring-ksp-blue-100">
                  {strength}
                </span>
              )}
            </div>
            {times.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {times.map((t) => (
                  <span
                    key={t.label}
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs ring-1 ring-slate-100"
                  >
                    <span className="font-semibold text-ksp-navy">{t.label}</span>
                    <span className="text-emerald-600">{t.value}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-xs text-ksp-gray">ไม่ได้ระบุเวลา</p>
            )}
            {note && <p className="mt-2 text-[11px] text-ksp-gray">หมายเหตุ: {note}</p>}
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────── Timeline ───────────────── */

interface TimelineItem {
  id: string;
  date: string;
  time?: string;
  title: string;
  secondary?: string;
  recordedBy?: string;
}

function TimelineCard({
  title,
  Icon,
  items,
}: {
  title: string;
  Icon: typeof Stethoscope;
  items: TimelineItem[];
}) {
  return (
    <SectionCard title={title} Icon={Icon} tone="violet">
      <div className="sm:col-span-2">
        {items.length === 0 ? (
          <p className="text-sm text-ksp-gray">ยังไม่มีประวัติ</p>
        ) : (
          <ol className="relative max-h-[20rem] space-y-3 overflow-y-auto border-l-2 border-ksp-blue-100 pl-4 pr-1">
            {items.map((i) => (
              <li key={i.id} className="relative">
                <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-ksp-blue-500 ring-4 ring-white" />
                <div className="flex items-center gap-1 text-xs text-ksp-gray">
                  <Calendar className="h-3 w-3" /> {formatDate(i.date)}
                  {i.time && ` · ${i.time}`}
                  {i.recordedBy && ` · โดย ${i.recordedBy}`}
                </div>
                <div className="mt-0.5 text-sm font-medium text-ksp-navy">{i.title}</div>
                {i.secondary && <div className="mt-0.5 text-xs text-ksp-gray">{i.secondary}</div>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </SectionCard>
  );
}

function dischargeDescription(a: Admission) {
  if (!a.dischargeDate) return "ยังพักอยู่ที่เรือนพยาบาล";
  const dest = {
    dormitory: "กลับเรือนนอน",
    home: "กลับบ้าน",
    hospital: "ส่งต่อโรงพยาบาล",
    other: "อื่นๆ",
  }[a.dischargeDestination ?? "other"];
  return `${dest} · ${formatDate(a.dischargeDate)} · ${a.totalDays ?? "?"} วัน`;
}

/* ───────────────── Main shared body ───────────────── */

export default function StudentDetailBody({
  student,
  showStatusBadge = false,
}: {
  student: StudentDetail;
  showStatusBadge?: boolean;
}) {
  const record = isPlainObject(student.healthData) ? student.healthData : {};

  const guardians =
    Array.isArray(student.guardians) && student.guardians.length > 0
      ? student.guardians
      : student.parentName || student.parentPhone
        ? [{ name: student.parentName ?? "", phone: student.parentPhone ?? "" }]
        : [];

  const healthItems: { label: string; value: string; wide?: boolean }[] = [
    { label: "โรคประจำตัว", value: student.congenitalDisease ?? "-", wide: true },
    { label: "แพ้ยา/อาหาร", value: student.drugAllergy ?? "-", wide: true },
    { label: "กรุ๊ปเลือด", value: student.bloodType === "unknown" ? "-" : student.bloodType },
    { label: "น้ำหนัก", value: valueFrom(record, ["น้ำหนัก (กิโลกรัม)", "น้ำหนัก"]) },
    { label: "ส่วนสูง", value: valueFrom(record, ["ส่วนสูง (เซนติเมตร)", "ส่วนสูง"]) },
    { label: "คะแนน BMI", value: valueFrom(record, ["คะแนน BMI", "คะแนน"]) },
    { label: "แปลผล BMI", value: valueFrom(record, ["แปลผล BMI", "แปลผล"]) },
    { label: "สิทธิการรักษา", value: valueFrom(record, ["สิทธิ"]) },
    { label: "วัคซีนพื้นฐาน", value: valueFrom(record, ["ได้รับวัคซีนพื้นฐาน(สมุดชมพู) ครบ/ไม่ครบ", "ได้รับวัคซีนพื้นฐาน(สมุดชมพู)"]) },
    { label: "วัคซีนไข้หวัดใหญ่", value: valueFrom(record, ["ฉีดวัคซีน ป้องกันไข้หวัดใหญ่ (ปี)", "ป้องกันไข้หวัดใหญ่ (ปี)"]) },
    { label: "วัคซีนโควิด", value: valueFrom(record, ["ฉีดวัคซีน ป้องกันโควิค (ปี)", "ป้องกันโควิค (ปี)"]) },
    { label: "ผลตรวจร่างกาย", value: valueFrom(record, ["ผลตรวจร่างกาย"]) },
  ];

  const noteValue = valueFrom(record, ["หมายเหตุ"]);

  return (
    <div className="space-y-4">
      {/* 1. ข้อมูลพื้นฐาน + ผู้ปกครอง */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="ข้อมูลพื้นฐาน" Icon={User} tone="blue">
          <Field label="รหัสนักเรียน" value={student.studentCode} />
          <Field label="เลขบัตรประชาชน" value={valueFrom(record, ["เลขบัตรประชาชน"])} />
          <Field label="ชื่อเล่น" value={student.nickname ?? valueFrom(record, ["ชื่อเล่น"])} />
          {showStatusBadge && <Field label="สถานะ" value={studentStatusLabel[student.studentStatus]} />}
          <Field label="วันเดือนปีเกิด" value={valueFrom(record, ["วันเดือนปีเกิด"])} />
          <Field label="ประเภทความพิการ" value={valueFrom(record, ["ประเภท ความพิการ", "ประเภท"])} />
          <Field label="เด็กเก่า/ใหม่" value={valueFrom(record, ["เด็กเก่า/ใหม่"])} />
          <Field label="วันรายงานตัว" value={valueFrom(record, ["วันและเวลา มารายงานตัว", "วันและเวลา"])} />
        </SectionCard>

        <SectionCard title="ผู้ปกครองและที่อยู่" Icon={Home} tone="emerald">
          <div className="sm:col-span-2 space-y-2">
            {guardians.length === 0 ? (
              <p className="text-sm text-ksp-gray">ยังไม่มีข้อมูลผู้ปกครอง</p>
            ) : (
              guardians.map((g, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5">
                  <span className="text-sm font-semibold text-ksp-navy">{g.name || "-"}</span>
                  <span className="text-sm text-ksp-blue-700">{g.phone || "-"}</span>
                </div>
              ))
            )}
          </div>
          <Field label="ที่อยู่" value={valueFrom(record, ["ที่อยู่"])} wide />
        </SectionCard>
      </div>

      {/* 2. ข้อมูลชั้นเรียน */}
      <SectionCard title="ข้อมูลชั้นเรียน" Icon={ClipboardList} tone="violet">
        <Field label="ชั้นเรียน" value={student.classRoom} />
        <Field label="เรือนนอน" value={student.dormitory} />
        <Field label="ครูประจำชั้น" value={student.homeroomTeacher} />
        <Field label="เบอร์โทรครูประจำชั้น" value={student.homeroomTeacherPhone} />
      </SectionCard>

      {/* 3. ข้อมูลสุขภาพ */}
      <SectionCard title="ข้อมูลสุขภาพ" Icon={HeartPulse} tone="rose">
        {healthItems
          .filter((i) => i.value && i.value !== "-")
          .map((item) => (
            <Field key={item.label} label={item.label} value={item.value} wide={item.wide} />
          ))}
      </SectionCard>

      {/* รายละเอียดยาประจำตัว */}
      <SectionCard title="รายละเอียดยาประจำตัว" Icon={Pill} tone="blue">
        <div className="sm:col-span-2">
          <MedicationList data={student.medicationData} />
        </div>
      </SectionCard>

      {noteValue !== "-" && (
        <SectionCard title="หมายเหตุ" Icon={NotebookText} tone="amber">
          <Field label="หมายเหตุ" value={noteValue} wide />
        </SectionCard>
      )}

      {/* 4. ข้อมูลการใช้งานเรือนพยาบาล */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TimelineCard
          title="ประวัติ OPD"
          Icon={Stethoscope}
          items={student.opdVisits.map((v) => ({
            id: v.id,
            date: v.visitDate,
            time: v.visitTime,
            title: v.chiefComplaint,
            secondary: v.diagnosis ?? v.treatment ?? "",
            recordedBy: v.recordedBy?.fullName,
          }))}
        />
        <TimelineCard
          title="ประวัติการนอนพักรักษา"
          Icon={BedDouble}
          items={student.admissions.map((a) => ({
            id: a.id,
            date: a.admitDate,
            time: a.admitTime,
            title: a.chiefComplaint,
            secondary: dischargeDescription(a),
            recordedBy: a.recordedBy?.fullName,
          }))}
        />
        <TimelineCard
          title="ประวัติการส่งต่อโรงพยาบาล"
          Icon={Send}
          items={student.referrals.map((r) => ({
            id: r.id,
            date: r.referralDate,
            time: r.referralTime,
            title: r.chiefComplaint,
            secondary: `ส่งไป: ${r.referredTo}`,
            recordedBy: r.recordedBy?.fullName,
          }))}
        />
        <SectionCard title="สรุปการใช้งาน" Icon={Activity} tone="emerald">
          <Field label="OPD" value={`${student.opdVisits.length} ครั้ง`} />
          <Field label="นอนพักรักษา" value={`${student.admissions.length} รายการ`} />
          <Field label="ส่งต่อโรงพยาบาล" value={`${student.referrals.length} รายการ`} />
          <Field label="ที่พัก" value={student.dormitory} />
        </SectionCard>
      </div>
    </div>
  );
}
