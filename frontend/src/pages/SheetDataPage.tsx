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
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Modal from "../components/common/Modal";
import { useToast } from "../components/common/useToast";
import {
  getSheetData,
  listSheetDormitories,
  type DormitoryOption,
  type SheetDataKind,
  type SheetRow,
  type SheetDataResponse,
} from "../services/sheetDataService";
import { getStudent, type StudentDetail } from "../services/studentsService";

interface SheetDataPageProps {
  kind: SheetDataKind;
}

const pageCopy = {
  health: {
    title: "ข้อมูลสุขภาพนักเรียน",
    description: "ข้อมูลสุขภาพแยกตามเรือนนอนจากฐานข้อมูล Supabase",
    icon: HeartPulse,
  },
  medication: {
    title: "ข้อมูลยาประจำตัวนักเรียน",
    description: "ข้อมูลรายการยาประจำตัวแยกตามเรือนนอนจากฐานข้อมูล Supabase",
    icon: Pill,
  },
} satisfies Record<SheetDataKind, unknown>;

export default function SheetDataPage({ kind }: SheetDataPageProps) {
  const copy = pageCopy[kind] as {
    title: string;
    description: string;
    icon: typeof HeartPulse;
  };
  const Icon = copy.icon;
  const toast = useToast();
  const [dormitories, setDormitories] = useState<DormitoryOption[]>([]);
  const [activeDormitory, setActiveDormitory] = useState("");
  const [sheet, setSheet] = useState<SheetDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [selectedRow, setSelectedRow] = useState<SheetRow | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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
      toast("โหลดข้อมูลจาก Supabase ไม่สำเร็จ", "error");
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

      <section className="overflow-hidden rounded-md border border-slate-300 bg-white">
        <div className="flex items-center justify-between border-b border-slate-300 bg-white px-4 py-3">
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
              title="ยังไม่มีข้อมูลใน Supabase"
              description="ยังไม่พบข้อมูลของเรือนนอนนี้ในฐานข้อมูล"
            />
          </div>
        ) : (
          <div className="max-h-[calc(100vh-17rem)] overflow-auto">
            <table className="min-w-max border-separate border-spacing-0 text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-100 text-ksp-navy">
                <tr>
                  <th className="border-b border-r border-slate-300 px-3 py-2.5 font-semibold">
                    ลำดับ
                  </th>
                  {sheet?.headers.map((header, index) => (
                    <th
                      key={`${header}-${index}`}
                      className="border-b border-r border-slate-300 px-3 py-2.5 font-semibold last:border-r-0"
                      style={{ minWidth: columnWidth(header, index) }}
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
                    className={`odd:bg-white even:bg-slate-50/70 hover:bg-ksp-blue-50/50 ${
                      row.studentId ? "cursor-pointer" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-2.5 font-semibold text-ksp-navy">
                      {row.rowNumber}
                    </td>
                    {sheet?.headers.map((header, index) => (
                      <td
                        key={`${row.rowNumber}-${header}-${index}`}
                        className={`max-w-[22rem] overflow-hidden text-ellipsis whitespace-nowrap border-b border-r border-slate-200 px-3 py-2.5 align-middle last:border-r-0 ${
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
        onClose={() => {
          setSelectedRow(null);
          setSelectedStudent(null);
        }}
        title="รายละเอียดนักเรียน"
        size="xl"
      >
        {detailLoading ? (
          <div className="grid min-h-48 place-items-center">
            <Loader2 className="h-7 w-7 animate-spin text-ksp-blue-600" />
          </div>
        ) : selectedRow ? (
          <StudentSheetPreview student={selectedStudent} row={selectedRow} />
        ) : null}
      </Modal>
    </div>
  );
}

function columnWidth(header: string, index: number) {
  if (index <= 1) return "10rem";
  if (header.includes("ชื่อ")) return "15rem";
  if (header.includes("ที่อยู่") || header.includes("หมายเหตุ")) return "22rem";
  if (header.includes("โรค") || header.includes("ยา") || header.includes("แพ้")) {
    return "16rem";
  }
  if (header.includes("กด ✓")) return "8rem";
  return "11rem";
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
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-ksp-blue-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-ksp-navy">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-ksp-blue-50 text-ksp-blue-700">
          {icon}
        </span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function StudentSheetPreview({
  student,
  row,
}: {
  student: StudentDetail | null;
  row: SheetRow;
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
      <div className="flex flex-col justify-between gap-3 rounded-xl bg-ksp-blue-50 px-4 py-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold text-ksp-gray">ข้อมูลจากฐาน Supabase</p>
          <h2 className="mt-1 text-2xl font-bold text-ksp-navy">{fullName}</h2>
          <p className="text-sm text-ksp-blue-700">
            {studentCode} · {classRoom} · {dormitory}
          </p>
        </div>
        <span className="w-fit rounded-full bg-white px-3 py-1 text-sm font-semibold text-ksp-blue-700 ring-1 ring-ksp-blue-100">
          {student ? studentStatusLabel[student.studentStatus] : "ประจำ"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DetailCard title="ข้อมูลพื้นฐาน" icon={<UserRound className="h-4 w-4" />}>
          <DetailItem label="รหัสนักเรียน" value={studentCode} />
          <DetailItem label="รหัสบัตรประชาชน" value={idCard} />
          <DetailItem label="ชั้นเรียน" value={classRoom} />
          <DetailItem label="เรือนนอน" value={dormitory} />
        </DetailCard>

        <DetailCard title="ข้อมูลสุขภาพ" icon={<HeartPulse className="h-4 w-4" />}>
          <DetailItem
            label="โรคประจำตัว"
            value={student?.congenitalDisease ?? rowValue(row, "โรคประจำตัว")}
          />
          <DetailItem
            label="ยาประจำตัว"
            value={student?.regularMedication ?? rowValue(row, "ยาประจำตัว", "รายการยา")}
          />
          <DetailItem
            label="แพ้ยา/อาหาร"
            value={student?.drugAllergy ?? rowValue(row, "แพ้ยา/อาหาร")}
          />
          <DetailItem label="กรุ๊ปเลือด" value={student?.bloodType ?? rowValue(row, "กรุปเลือด")} />
        </DetailCard>

        <DetailCard title="ผู้ปกครอง" icon={<Phone className="h-4 w-4" />}>
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DetailCard title="ข้อมูลจากตาราง" icon={<IdCard className="h-4 w-4" />}>
          {Object.entries(row.record)
            .filter(([, value]) => value && value !== "-")
            .slice(0, 12)
            .map(([key, value]) => (
              <DetailItem key={key} label={key} value={value} />
            ))}
        </DetailCard>
        <DetailCard title="ประวัติการใช้งาน" icon={<School className="h-4 w-4" />}>
          <DetailItem label="OPD" value={student ? `${student.opdVisits.length} ครั้ง` : "-"} />
          <DetailItem label="Admit" value={student ? `${student.admissions.length} รายการ` : "-"} />
          <DetailItem label="ส่งต่อโรงพยาบาล" value={student ? `${student.referrals.length} รายการ` : "-"} />
          <DetailItem label="ที่พัก" value={dormitory} />
        </DetailCard>
      </div>
    </div>
  );
}
