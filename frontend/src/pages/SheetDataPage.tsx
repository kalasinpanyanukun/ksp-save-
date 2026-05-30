import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ExternalLink,
  HeartPulse,
  Loader2,
  Pill,
  RefreshCw,
  Search,
  UserRound,
  IdCard,
  School,
  Phone,
  Edit3,
  Stethoscope,
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Modal from "../components/common/Modal";
import PatientForm from "../components/patients/PatientForm";
import { useToast } from "../components/common/useToast";
import { useAppSelector } from "../store";
import {
  getSheetData,
  listSheetDormitories,
  type DormitoryOption,
  type SheetDataKind,
  type SheetRow,
  type SheetDataResponse,
} from "../services/sheetDataService";
import {
  getStudent,
  updateStudent,
  type StudentDetail,
  type StudentInput,
} from "../services/studentsService";

interface SheetDataPageProps {
  kind: SheetDataKind;
}

const pageCopy = {
  health: {
    title: "ข้อมูลสุขภาพนักเรียน",
    description: "ข้อมูลสุขภาพแยกตามเรือนนอน",
    icon: HeartPulse,
  },
  medication: {
    title: "ข้อมูลยาประจำตัวนักเรียน",
    description: "ข้อมูลรายการยาประจำตัวแยกตามเรือนนอน",
    icon: Pill,
  },
} satisfies Record<SheetDataKind, unknown>;

// โทนพาสเทลแนวโรงพยาบาล (จาง ๆ) ไล่ตามคอลัมน์เพื่อให้อ่านง่าย
const COLUMN_TINTS = [
  { head: "bg-sky-100/70", body: "bg-sky-50/40" },
  { head: "bg-emerald-100/60", body: "bg-emerald-50/40" },
  { head: "bg-violet-100/55", body: "bg-violet-50/35" },
  { head: "bg-amber-100/60", body: "bg-amber-50/35" },
  { head: "bg-rose-100/55", body: "bg-rose-50/35" },
  { head: "bg-teal-100/55", body: "bg-teal-50/35" },
];
const tintFor = (index: number) =>
  COLUMN_TINTS[index % COLUMN_TINTS.length] ?? COLUMN_TINTS[0]!;

const LONG_COLUMNS = [
  "รายการยา",
  "ยาประจำตัว",
  "โรคประจำตัว",
  "แพ้ยา",
  "ที่อยู่",
  "หมายเหตุ",
  "อาการ",
  "ผลตรวจ",
];
const isLongColumn = (header: string) =>
  LONG_COLUMNS.some((key) => header.includes(key));

export default function SheetDataPage({ kind }: SheetDataPageProps) {
  const copy = pageCopy[kind] as {
    title: string;
    description: string;
    icon: typeof HeartPulse;
  };
  const Icon = copy.icon;
  const toast = useToast();
  const role = useAppSelector((s) => s.auth.user?.role);
  const isAdmin = role === "super_admin" || role === "admin";
  const [dormitories, setDormitories] = useState<DormitoryOption[]>([]);
  const [activeDormitory, setActiveDormitory] = useState("");
  const [sheet, setSheet] = useState<SheetDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [selectedRow, setSelectedRow] = useState<SheetRow | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listSheetDormitories()
      .then((items) => {
        setDormitories(items);
        setActiveDormitory((current) => current || items[0]?.name || "");
      })
      .catch(() => toast("โหลดรายชื่อเรือนนอนไม่สำเร็จ", "error"));
  }, [toast]);

  const load = useCallback(async () => {
    if (!activeDormitory) return;
    setLoading(true);
    try {
      setSheet(await getSheetData(kind, activeDormitory));
    } catch {
      toast("โหลดข้อมูลไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  }, [activeDormitory, kind, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const rows = sheet?.rows ?? [];
    const keyword = q.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter((row) =>
      row.cells.some((cell) => cell.toLowerCase().includes(keyword)),
    );
  }, [q, sheet]);

  const openStudentDetail = useCallback(
    async (row: SheetRow) => {
      if (!row.studentId) return;
      setSelectedRow(row);
      setSelectedStudent(null);
      setDetailLoading(true);
      try {
        setSelectedStudent(await getStudent(row.studentId));
      } catch {
        toast("โหลดรายละเอียดนักเรียนไม่สำเร็จ", "error");
      } finally {
        setDetailLoading(false);
      }
    },
    [toast],
  );

  function closeDetail() {
    setSelectedRow(null);
    setSelectedStudent(null);
  }

  async function handleEditSubmit(data: StudentInput) {
    if (!selectedStudent) return;
    setSubmitting(true);
    try {
      await updateStudent(selectedStudent.id, data);
      toast("อัปเดตข้อมูลเรียบร้อย ระบบจะซิงก์ทุกเมนูให้อัตโนมัติ", "success");
      setEditOpen(false);
      const refreshed = await getStudent(selectedStudent.id);
      setSelectedStudent(refreshed);
      await load();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "บันทึกไม่สำเร็จ";
      toast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative left-1/2 w-[calc(100vw-2rem)] -translate-x-1/2 lg:w-[calc(100vw-18rem-2rem)]">
      <PageHeader
        title={copy.title}
        description={copy.description}
        actions={
          <>
            {sheet?.sourceUrl && (
              <a
                href={sheet.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-outline"
              >
                <ExternalLink className="h-4 w-4" /> เปิดชีตต้นทาง
              </a>
            )}
            <button type="button" className="btn-outline" onClick={load}>
              <RefreshCw className="h-4 w-4" /> โหลดใหม่
            </button>
          </>
        }
      />

      <div className="mb-3 flex flex-col gap-3 rounded-md border border-ksp-blue-100 bg-white px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {dormitories.map((item) => (
            <button
              key={item.key}
              type="button"
              className={
                activeDormitory === item.name
                  ? "rounded-md border border-ksp-blue-600 bg-ksp-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm"
                  : "rounded-md border border-ksp-blue-200 bg-white px-3 py-2 text-xs font-semibold text-ksp-blue-700 hover:bg-ksp-blue-50"
              }
              onClick={() => setActiveDormitory(item.name)}
            >
              {item.name}
            </button>
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

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-ksp-blue-50 text-ksp-blue-700">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-ksp-navy">
                เรือนนอน{sheet?.dormitory ?? activeDormitory}
              </h2>
              <p className="text-xs text-ksp-gray">
                {filteredRows.length.toLocaleString("th-TH")} รายการ
              </p>
              {kind === "medication" && sheet?.teacher && (
                <p className="mt-0.5 text-xs font-medium text-ksp-blue-700">
                  ครูพยาบาลผู้รับผิดชอบ: {sheet.teacher}
                </p>
              )}
            </div>
          </div>
          {loading && <Loader2 className="h-5 w-5 animate-spin text-ksp-blue-500" />}
        </div>

        {!loading && filteredRows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="ยังไม่มีข้อมูล"
              description="ยังไม่พบข้อมูลของเรือนนอนนี้"
            />
          </div>
        ) : (
          <div className="max-h-[calc(100vh-17rem)] overflow-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-100 px-3 py-2.5 font-semibold text-ksp-navy">
                    ลำดับ
                  </th>
                  {sheet?.headers.map((header, index) => (
                    <th
                      key={`${header}-${index}`}
                      className={`whitespace-nowrap border-b border-r border-slate-200 px-3 py-2.5 font-semibold text-ksp-navy last:border-r-0 ${tintFor(index).head}`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr
                    key={row.rowNumber}
                    role={row.studentId ? "button" : undefined}
                    tabIndex={row.studentId ? 0 : undefined}
                    onClick={() => openStudentDetail(row)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openStudentDetail(row);
                      }
                    }}
                    className={`transition-shadow hover:shadow-[inset_3px_0_0_0_#4B98EC] ${
                      row.studentId ? "cursor-pointer" : ""
                    }`}
                  >
                    <td className="sticky left-0 z-10 whitespace-nowrap border-b border-r border-slate-100 bg-white px-3 py-2.5 font-semibold text-ksp-navy">
                      {row.rowNumber}
                    </td>
                    {sheet?.headers.map((header, index) => (
                      <td
                        key={`${row.rowNumber}-${header}-${index}`}
                        className={`border-b border-r border-slate-100 px-3 py-2.5 last:border-r-0 ${tintFor(index).body} ${
                          isLongColumn(header)
                            ? "min-w-[16rem] max-w-[28rem] whitespace-normal align-top leading-relaxed"
                            : "whitespace-nowrap"
                        } ${
                          header === "ชื่อ-สกุล"
                            ? "font-semibold text-ksp-blue-700"
                            : "text-ksp-navy/85"
                        }`}
                        title={row.cells[index] ?? ""}
                      >
                        <CellValue header={header} value={row.cells[index] ?? ""} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={Boolean(selectedRow)}
        onClose={closeDetail}
        title="รายละเอียดนักเรียน"
        size="xl"
      >
        {detailLoading ? (
          <div className="grid min-h-48 place-items-center">
            <Loader2 className="h-7 w-7 animate-spin text-ksp-blue-600" />
          </div>
        ) : selectedRow ? (
          <StudentSheetPreview
            student={selectedStudent}
            row={selectedRow}
            canEdit={isAdmin && Boolean(selectedStudent)}
            onEdit={() => setEditOpen(true)}
          />
        ) : null}
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="แก้ไขข้อมูลนักเรียน"
        size="lg"
      >
        {selectedStudent && (
          <PatientForm
            initial={selectedStudent}
            submitting={submitting}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}

function isCheckboxColumn(header: string) {
  return header.includes("กด ✓") || header.includes("ถ้ามีกด ✓");
}

function CellValue({ header, value }: { header: string; value: string }) {
  if (isCheckboxColumn(header)) {
    const checked = value.toUpperCase() === "TRUE" || value === "จริง" || value === "✓";
    return (
      <span
        aria-label={checked ? "เลือกแล้ว" : "ยังไม่เลือก"}
        className={`inline-grid h-5 w-5 place-items-center rounded border text-[11px] font-bold ${
          checked
            ? "border-ksp-blue-600 bg-ksp-blue-600 text-white"
            : "border-slate-300 bg-white text-transparent"
        }`}
      >
        ✓
      </span>
    );
  }

  if (!value) return <span className="text-ksp-gray">-</span>;
  return <span>{value}</span>;
}

const studentStatusLabel = {
  resident: "ประจำ",
  infirmary: "ป่วย(นอนเรือนบาล)",
  home_leave: "ลากลับบ้าน",
} as const;

function rowValue(row: SheetRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row.record[key]?.trim();
    if (value) return value;
  }
  return "-";
}

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold text-ksp-gray">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-ksp-navy">
        {value || "-"}
      </p>
    </div>
  );
}

function DetailCard({
  title,
  icon,
  tone = "blue",
  children,
}: {
  title: string;
  icon: ReactNode;
  tone?: "blue" | "rose" | "emerald";
  children: ReactNode;
}) {
  const toneClass = {
    blue: "bg-ksp-blue-50 text-ksp-blue-700",
    rose: "bg-rose-50 text-rose-600",
    emerald: "bg-emerald-50 text-emerald-600",
  }[tone];
  return (
    <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-ksp-navy">
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${toneClass}`}>
          {icon}
        </span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function medText(med: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = med[key];
    if (value !== null && value !== undefined && String(value).trim() && String(value).trim() !== "-") {
      return String(value).trim();
    }
  }
  return "";
}

function MedicationDetail({ student }: { student: StudentDetail }) {
  const data = student.medicationData;
  const rows =
    data && typeof data === "object" && Array.isArray((data as Record<string, unknown>)["รายการยา"])
      ? ((data as Record<string, unknown>)["รายการยา"] as Record<string, unknown>[])
      : [];

  if (rows.length === 0) {
    return (
      <DetailCard title="รายละเอียดยาประจำตัว" icon={<Pill className="h-4 w-4" />}>
        <p className="text-sm text-ksp-gray sm:col-span-2">ยังไม่มีข้อมูลยาประจำตัว</p>
      </DetailCard>
    );
  }

  const schedule = (med: Record<string, unknown>) =>
    [
      ["เช้า", medText(med, "เช้า", "การรับประทาน เช้า")],
      ["เที่ยง", medText(med, "เที่ยง", "การรับประทาน เที่ยง")],
      ["เย็น", medText(med, "เย็น", "การรับประทาน เย็น")],
      ["ก่อนนอน", medText(med, "ก่อนนอน", "การรับประทาน ก่อนนอน")],
      ["นอกเวลา", medText(med, "นอกเวลา")],
    ].filter(([, value]) => value);

  return (
    <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-ksp-navy">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-ksp-blue-50 text-ksp-blue-700">
          <Pill className="h-4 w-4" />
        </span>
        <h3 className="font-semibold">รายละเอียดยาประจำตัว</h3>
        <span className="chip-blue ml-auto">{rows.length} ชนิด</span>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {rows.map((med, index) => {
          const name = medText(med, "ชื่อยา", "ข้อมูลยา ชื่อยา") || `ยาที่ ${index + 1}`;
          const secondary = medText(med, "ชื่อรอง", "ข้อมูลยา ชื่อรอง");
          const strength = medText(med, "ขนาดยา", "ข้อมูลยา ขนาดยา");
          const amount = medText(med, "จำนวน", "ข้อมูลยา จำนวน (หน่วย)", "จำนวน (หน่วย)");
          const note = medText(med, "หมายเหตุ");
          const times = schedule(med);
          return (
            <div
              key={index}
              className="rounded-lg border border-ksp-blue-50 bg-ksp-bg/40 p-3"
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-semibold text-ksp-navy">{name}</span>
                {secondary && <span className="text-xs text-ksp-gray">({secondary})</span>}
                {strength && (
                  <span className="rounded bg-white px-1.5 py-0.5 text-[11px] font-semibold text-ksp-blue-700 ring-1 ring-ksp-blue-100">
                    {strength}
                  </span>
                )}
              </div>
              {times.length > 0 ? (
                <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-2">
                  {times.map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-md bg-white px-2 py-1.5 ring-1 ring-slate-100"
                    >
                      <p className="text-[10px] font-semibold uppercase text-ksp-gray">
                        {label}
                      </p>
                      <p className="text-xs font-medium text-ksp-navy">{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-xs text-ksp-gray">ไม่ได้ระบุเวลา</p>
              )}
              {(amount || note) && (
                <p className="mt-2 text-[11px] text-ksp-gray">
                  {amount && <>จำนวน {amount}</>}
                  {amount && note && " · "}
                  {note && <>หมายเหตุ: {note}</>}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StudentSheetPreview({
  student,
  row,
  canEdit,
  onEdit,
}: {
  student: StudentDetail | null;
  row: SheetRow;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const fullName = student
    ? `${student.firstName} ${student.lastName}`
    : rowValue(row, "ชื่อ-สกุล");
  const studentCode = student?.studentCode ?? rowValue(row, "รหัสนักเรียน");
  const classRoom = student?.classRoom ?? rowValue(row, "ชั้นเรียน");
  const dormitory = student?.dormitory ?? rowValue(row, "เรือนนอน");
  const idCard = rowValue(row, "รหัสบัตรประชาชน", "เลขบัตรประชาชน");

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 rounded-xl bg-gradient-to-r from-ksp-blue-50 to-sky-50 px-4 py-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-ksp-navy">{fullName}</h2>
          <p className="text-sm text-ksp-blue-700">
            {studentCode} · {classRoom} · {dormitory}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-fit rounded-full bg-white px-3 py-1 text-sm font-semibold text-ksp-blue-700 ring-1 ring-ksp-blue-100">
            {student ? studentStatusLabel[student.studentStatus] : "ประจำ"}
          </span>
          {canEdit && (
            <button type="button" className="btn-primary px-3 py-2" onClick={onEdit}>
              <Edit3 className="h-4 w-4" /> แก้ไขข้อมูล
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DetailCard title="ข้อมูลพื้นฐาน" icon={<UserRound className="h-4 w-4" />}>
          <DetailItem label="รหัสนักเรียน" value={studentCode} />
          <DetailItem label="รหัสบัตรประชาชน" value={idCard} />
          <DetailItem label="ชั้นเรียน" value={classRoom} />
          <DetailItem label="เรือนนอน" value={dormitory} />
        </DetailCard>

        <DetailCard title="ข้อมูลสุขภาพ" tone="rose" icon={<Stethoscope className="h-4 w-4" />}>
          <DetailItem
            label="โรคประจำตัว"
            value={student?.congenitalDisease ?? rowValue(row, "โรคประจำตัว")}
          />
          <DetailItem
            label="แพ้ยา/อาหาร"
            value={student?.drugAllergy ?? rowValue(row, "แพ้ยา/อาหาร")}
          />
          <DetailItem
            label="ยาประจำตัว"
            value={student?.regularMedication ?? rowValue(row, "ยาประจำตัว", "รายการยา")}
          />
          <DetailItem label="กรุ๊ปเลือด" value={student?.bloodType ?? rowValue(row, "กรุปเลือด")} />
        </DetailCard>

        <DetailCard title="ผู้ปกครอง" tone="emerald" icon={<Phone className="h-4 w-4" />}>
          <DetailItem
            label="ผู้ปกครอง"
            value={student?.parentName ?? rowValue(row, "ผู้ปกครอง")}
          />
          <DetailItem
            label="เบอร์โทร"
            value={student?.parentPhone ?? rowValue(row, "เบอร์โทร")}
          />
          <DetailItem label="ครูประจำชั้น" value={student?.homeroomTeacher ?? "-"} />
          <DetailItem label="จำนวนประวัติ OPD" value={student ? `${student.opdVisits.length} ครั้ง` : "-"} />
        </DetailCard>
      </div>

      {student && <MedicationDetail student={student} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DetailCard title="ข้อมูลจากตาราง" icon={<IdCard className="h-4 w-4" />}>
          {Object.entries(row.record)
            .filter(([, value]) => value && value !== "-")
            .slice(0, 12)
            .map(([key, value]) => (
              <DetailItem key={key} label={key} value={value} />
            ))}
        </DetailCard>
        <DetailCard title="ประวัติการใช้งาน" tone="emerald" icon={<School className="h-4 w-4" />}>
          <DetailItem label="OPD" value={student ? `${student.opdVisits.length} ครั้ง` : "-"} />
          <DetailItem label="Admit" value={student ? `${student.admissions.length} รายการ` : "-"} />
          <DetailItem label="ส่งต่อโรงพยาบาล" value={student ? `${student.referrals.length} รายการ` : "-"} />
          <DetailItem label="ที่พัก" value={dormitory} />
        </DetailCard>
      </div>
    </div>
  );
}
