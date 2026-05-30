import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HeartPulse,
  Loader2,
  Pill,
  Search,
  Edit3,
  UserCog,
  Check,
  X,
} from "lucide-react";
import EmptyState from "../components/common/EmptyState";
import Modal from "../components/common/Modal";
import PdfExportButton from "../components/common/PdfExportButton";
import PatientForm from "../components/patients/PatientForm";
import StudentDetailBody from "../components/patients/StudentDetailBody";
import { useToast } from "../components/common/useToast";
import { useAppSelector } from "../store";
import {
  getSheetData,
  listSheetDormitories,
  updateSheetTeacher,
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

// โทนพาสเทลแนวโรงพยาบาล — หัวตารางทึบ (อ่านง่าย ไม่ทับกัน) เนื้อหาจาง ๆ
const COLUMN_TINTS = [
  { head: "bg-sky-100", body: "bg-sky-50/40" },
  { head: "bg-emerald-100", body: "bg-emerald-50/40" },
  { head: "bg-violet-100", body: "bg-violet-50/35" },
  { head: "bg-amber-100", body: "bg-amber-50/35" },
  { head: "bg-rose-100", body: "bg-rose-50/35" },
  { head: "bg-teal-100", body: "bg-teal-50/35" },
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
  const [editingTeacher, setEditingTeacher] = useState(false);
  const [teacherDraft, setTeacherDraft] = useState("");
  const [savingTeacher, setSavingTeacher] = useState(false);

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
      setSelectedStudent(await getStudent(selectedStudent.id));
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

  async function saveTeacher() {
    if (!sheet) return;
    setSavingTeacher(true);
    try {
      await updateSheetTeacher(activeDormitory, teacherDraft.trim());
      toast("บันทึกชื่อครูพยาบาลเรียบร้อย", "success");
      setEditingTeacher(false);
      await load();
    } catch {
      toast("บันทึกไม่สำเร็จ", "error");
    } finally {
      setSavingTeacher(false);
    }
  }

  return (
    <div className="relative left-1/2 w-[calc(100vw-2rem)] -translate-x-1/2 lg:w-[calc(100vw-18rem-2rem)]">
      {/* Header: count becomes the subtitle; teacher (medication) sits on the right */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-ksp-blue-50 text-ksp-blue-700">
            <Icon className="h-5.5 w-5.5" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ksp-navy">
              {copy.title}
            </h1>
            <p className="text-sm text-ksp-gray">
              เรือนนอน{sheet?.dormitory ?? activeDormitory} ·{" "}
              <span className="font-semibold text-ksp-blue-600">
                {filteredRows.length.toLocaleString("th-TH")} รายการ
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <PdfExportButton
          getReport={() => ({
            title: kind === "health" ? "รายงานข้อมูลสุขภาพนักเรียน" : "รายงานข้อมูลยาประจำตัวนักเรียน",
            subtitle: `เรือนนอน${sheet?.dormitory ?? activeDormitory} · ${filteredRows.length} รายการ${
              kind === "medication" && sheet?.teacher ? ` · ครูพยาบาล: ${sheet.teacher}` : ""
            }`,
            orientation: "l",
            fontSize: 10,
            columns: [
              { header: "ลำดับ", weight: 0.5 },
              ...(sheet?.headers ?? []).map((h) => ({
                header: h,
                weight: h === "รายการยา" || h.includes("ที่อยู่") ? 2.4 : 1,
              })),
            ],
            rows: filteredRows.map((row) => [row.rowNumber, ...(sheet?.headers ?? []).map((_, i) => row.cells[i] ?? "-")]),
          })}
        />
        {kind === "medication" && (
          <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-xl border border-ksp-blue-100 bg-gradient-to-r from-ksp-blue-50/70 to-sky-50/50 px-3 py-2">
            {editingTeacher ? (
              <>
                <UserCog className="h-4 w-4 shrink-0 text-ksp-blue-600" />
                <input
                  className="input min-w-[14rem] py-1.5 text-sm"
                  value={teacherDraft}
                  onChange={(e) => setTeacherDraft(e.target.value)}
                  placeholder="ชื่อครูพยาบาล · เบอร์โทร"
                  autoFocus
                />
                <button type="button" className="btn-primary px-2.5 py-1.5" onClick={saveTeacher} disabled={savingTeacher}>
                  {savingTeacher ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </button>
                <button type="button" className="btn-outline px-2.5 py-1.5" onClick={() => setEditingTeacher(false)}>
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <UserCog className="h-4 w-4 shrink-0 text-ksp-blue-600" />
                <span className="text-sm text-ksp-navy">
                  <span className="font-semibold">ครูพยาบาลผู้รับผิดชอบ:</span> {sheet?.teacher || "—"}
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    className="btn-outline px-2.5 py-1.5 text-xs"
                    onClick={() => {
                      setTeacherDraft(sheet?.teacher ?? "");
                      setEditingTeacher(true);
                    }}
                  >
                    <Edit3 className="h-3.5 w-3.5" /> แก้ไขครู
                  </button>
                )}
              </>
            )}
          </div>
        )}
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-3 rounded-xl border border-ksp-blue-100 bg-white px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {dormitories.map((item) => (
            <button
              key={item.key}
              type="button"
              className={
                activeDormitory === item.name
                  ? "rounded-lg border border-ksp-blue-600 bg-ksp-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm"
                  : "rounded-lg border border-ksp-blue-200 bg-white px-3 py-2 text-xs font-semibold text-ksp-blue-700 hover:bg-ksp-blue-50"
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

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        {loading && (
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2 text-xs text-ksp-gray">
            <Loader2 className="h-4 w-4 animate-spin text-ksp-blue-500" /> กำลังโหลด…
          </div>
        )}
        {!loading && filteredRows.length === 0 ? (
          <div className="p-6">
            <EmptyState title="ยังไม่มีข้อมูล" description="ยังไม่พบข้อมูลของเรือนนอนนี้" />
          </div>
        ) : (
          <div className="max-h-[calc(100vh-15rem)] overflow-auto">
            <table className="w-full border-collapse text-center text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 top-0 z-30 border-b-2 border-r border-slate-300 bg-slate-200 px-3 py-2.5 text-center font-bold text-ksp-navy shadow-sm">
                    ลำดับ
                  </th>
                  {sheet?.headers.map((header, index) => (
                    <th
                      key={`${header}-${index}`}
                      className={`sticky top-0 z-20 whitespace-nowrap border-b-2 border-r border-slate-300 px-3 py-2.5 text-center font-bold text-ksp-navy shadow-sm last:border-r-0 ${tintFor(index).head}`}
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
                    <td className="sticky left-0 z-10 whitespace-nowrap border-b border-r border-slate-100 bg-white px-3 py-2.5 text-center font-semibold text-ksp-navy">
                      {row.rowNumber}
                    </td>
                    {sheet?.headers.map((header, index) => {
                      const long = isLongColumn(header);
                      return (
                        <td
                          key={`${row.rowNumber}-${header}-${index}`}
                          className={`border-b border-r border-slate-100 px-3 py-2.5 last:border-r-0 ${tintFor(index).body} ${
                            long
                              ? "min-w-[18rem] max-w-[30rem] whitespace-normal text-left align-top leading-relaxed"
                              : "whitespace-nowrap text-center align-middle"
                          } ${header === "ชื่อ-สกุล" ? "font-semibold text-ksp-blue-700" : "text-ksp-navy/85"}`}
                          title={header === "รายการยา" ? undefined : row.cells[index] ?? ""}
                        >
                          {header === "รายการยา" ? (
                            <MedicationCell value={row.cells[index] ?? ""} />
                          ) : (
                            <CellValue header={header} value={row.cells[index] ?? ""} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal open={Boolean(selectedRow)} onClose={closeDetail} title="รายละเอียดนักเรียน" size="xl">
        {detailLoading ? (
          <div className="grid min-h-48 place-items-center">
            <Loader2 className="h-7 w-7 animate-spin text-ksp-blue-600" />
          </div>
        ) : selectedRow ? (
          <div className="space-y-4">
            <div className="flex flex-col justify-between gap-3 rounded-2xl bg-gradient-to-r from-ksp-blue-50 to-sky-50 px-4 py-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-bold text-ksp-navy">
                  {selectedStudent
                    ? `${selectedStudent.firstName} ${selectedStudent.lastName}`
                    : rowValue(selectedRow, "ชื่อ-สกุล")}
                </h2>
                <p className="text-sm text-ksp-blue-700">
                  {(selectedStudent?.studentCode ?? rowValue(selectedRow, "รหัสนักเรียน"))} ·{" "}
                  {(selectedStudent?.classRoom ?? rowValue(selectedRow, "ชั้นเรียน"))} ·{" "}
                  {(selectedStudent?.dormitory ?? rowValue(selectedRow, "เรือนนอน"))}
                </p>
              </div>
              {isAdmin && selectedStudent && (
                <button type="button" className="btn-primary self-start px-3 py-2 sm:self-auto" onClick={() => setEditOpen(true)}>
                  <Edit3 className="h-4 w-4" /> แก้ไขข้อมูล
                </button>
              )}
            </div>
            {selectedStudent && <StudentDetailBody student={selectedStudent} showStatusBadge />}
          </div>
        ) : null}
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="แก้ไขข้อมูลนักเรียน" size="lg">
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

/** แสดงคอลัมน์รายการยาเป็นลิสต์: ชื่อยา (สีน้ำเงิน) อยู่หน้า เวลากิน (สีเขียว) อยู่หลัง */
function MedicationCell({ value }: { value: string }) {
  if (!value) return <span className="text-ksp-gray">-</span>;
  const items = value
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    <ul className="space-y-1.5">
      {items.map((item, index) => {
        const open = item.indexOf("(");
        const name = open >= 0 ? item.slice(0, open).trim() : item;
        const schedule =
          open >= 0 ? item.slice(open).replace(/^\(/, "").replace(/\)$/, "").trim() : "";
        return (
          <li key={index} className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="font-semibold text-ksp-blue-700">{name}</span>
            {schedule && <span className="text-emerald-600">({schedule})</span>}
          </li>
        );
      })}
    </ul>
  );
}

function rowValue(row: SheetRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row.record[key]?.trim();
    if (value) return value;
  }
  return "-";
}
