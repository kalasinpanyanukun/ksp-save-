import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Search,
  Upload,
  Edit3,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import PatientForm from "../components/patients/PatientForm";
import PatientImport from "../components/patients/PatientImport";
import PdfExportButton from "../components/common/PdfExportButton";
import { useAppSelector } from "../store";
import { useToast } from "../components/common/useToast";
import {
  createStudent,
  deleteStudent,
  fetchClassrooms,
  fetchDormitories,
  listStudents,
  updateStudent,
  type StudentInput,
} from "../services/studentsService";
import type { Student } from "../types";

const studentStatusLabel: Record<Student["studentStatus"], string> = {
  resident: "ประจำ",
  infirmary: "ป่วย(นอนเรือนบาล)",
  home_leave: "ลากลับบ้าน",
};

const studentStatusClass: Record<Student["studentStatus"], string> = {
  resident: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  infirmary: "bg-orange-50 text-orange-700 ring-orange-100",
  home_leave: "bg-sky-50 text-sky-700 ring-sky-100",
};

function healthField(s: Student, ...keys: string[]) {
  const d = s.healthData as Record<string, unknown> | undefined;
  if (!d) return "";
  for (const k of keys) {
    const v = d[k];
    const t = v === null || v === undefined ? "" : String(v).trim();
    if (t && t !== "-") return t;
  }
  return "";
}

// ข้อมูลชุดเดียวกัน: ใช้คอลัมน์ Student ก่อน ถ้าไม่มีค่อย fallback ไป healthData ของชีต
function nicknameOf(s: Student) {
  return s.nickname || healthField(s, "ชื่อเล่น");
}
function disabilityOf(s: Student) {
  return healthField(s, "ประเภท ความพิการ", "ประเภท");
}
function ageTypeOf(s: Student) {
  return healthField(s, "เด็กเก่า/ใหม่");
}
function disabilityCodes(s: Student): string[] {
  return disabilityOf(s).match(/\d+/g) ?? [];
}

const DISABILITY_TYPES = ["1", "2", "3", "4", "5", "6", "7"];

export default function PatientListPage() {
  const role = useAppSelector((s) => s.auth.user?.role);
  const isAdmin = role === "super_admin" || role === "admin";
  const toast = useToast();
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(500);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [dormFilter, setDormFilter] = useState("");
  const [ageFilter, setAgeFilter] = useState("");
  const [disability1, setDisability1] = useState("");
  const [disability2, setDisability2] = useState("");
  const [classrooms, setClassrooms] = useState<string[]>([]);
  const [dormitories, setDormitories] = useState<string[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleting, setDeleting] = useState<Student | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listStudents({
        q,
        classRoom: classFilter || undefined,
        dormitory: dormFilter || undefined,
        page,
        pageSize,
      });
      setStudents(res.data);
      setTotal(res.total);
    } catch {
      toast("โหลดรายชื่อนักเรียนไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  }, [q, classFilter, dormFilter, page, pageSize, toast]);

  useEffect(() => {
    fetchClassrooms().then(setClassrooms).catch(() => {});
    fetchDormitories().then(setDormitories).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [q, classFilter, dormFilter]);

  async function handleSubmit(data: StudentInput) {
    setSubmitting(true);
    try {
      if (editing) {
        await updateStudent(editing.id, data);
        toast("อัปเดตข้อมูลนักเรียนเรียบร้อย", "success");
      } else {
        await createStudent(data);
        toast("เพิ่มนักเรียนเรียบร้อย", "success");
      }
      setFormOpen(false);
      setEditing(null);
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

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteStudent(deleting.id);
      toast("ลบข้อมูลนักเรียนเรียบร้อย", "success");
      await load();
    } catch {
      toast("ไม่สามารถดำเนินการได้", "error");
    } finally {
      setDeleting(null);
    }
  }

  const filteredStudents = useMemo(
    () =>
      students.filter((s) => {
        if (ageFilter && ageTypeOf(s) !== ageFilter) return false;
        if (disability1 || disability2) {
          const codes = disabilityCodes(s);
          if (disability1 && !codes.includes(disability1)) return false;
          if (disability2 && !codes.includes(disability2)) return false;
        }
        return true;
      }),
    [students, ageFilter, disability1, disability2],
  );

  return (
    <>
      <PageHeader
        title="ข้อมูลนักเรียน"
        description={`ทั้งหมด ${total.toLocaleString("th-TH")} คน`}
        actions={
          <>
            <PdfExportButton
              getReport={() => ({
                title: "รายงานข้อมูลนักเรียน",
                subtitle: `แสดง ${filteredStudents.length} จากทั้งหมด ${total.toLocaleString("th-TH")} คน`,
                orientation: "l",
                fontSize: 13,
                columns: [
                  { header: "ลำดับ", weight: 0.4 },
                  { header: "รหัสบัตรประชาชน", weight: 1.3 },
                  { header: "ชื่อ-สกุล", weight: 1.8 },
                  { header: "ชื่อเล่น", weight: 0.9 },
                  { header: "ประเภทความพิการ", weight: 1.4 },
                  { header: "ชั้นเรียน", weight: 0.8 },
                  { header: "เรือนนอน", weight: 1 },
                  { header: "สถานะ", weight: 1 },
                  { header: "เด็กเก่า/ใหม่", weight: 0.8 },
                ],
                rows: filteredStudents.map((s, i) => [
                  i + 1,
                  s.studentCode,
                  `${s.firstName} ${s.lastName}`,
                  nicknameOf(s) || "-",
                  disabilityOf(s) || "-",
                  s.classRoom ?? "-",
                  s.dormitory ?? "-",
                  studentStatusLabel[s.studentStatus ?? "resident"],
                  ageTypeOf(s) || "-",
                ]),
              })}
            />
            {isAdmin && (
              <>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setImportOpen(true)}
              >
                <Upload className="h-4 w-4" /> นำเข้า Excel/CSV
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4" /> เพิ่มนักเรียน
              </button>
              </>
            )}
          </>
        }
      />

      <div className="card-pad mb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ksp-gray" />
            <input
              className="input pl-9"
              placeholder="ค้นหาด้วยรหัส, ชื่อ, นามสกุล"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-md text-ksp-gray hover:bg-ksp-blue-50"
                onClick={() => setQ("")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <select
            className="input"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="">ทุกชั้นเรียน</option>
            {classrooms.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={dormFilter}
            onChange={(e) => setDormFilter(e.target.value)}
          >
            <option value="">ทุกเรือนนอน</option>
            {dormitories.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select className="input" value={ageFilter} onChange={(e) => setAgeFilter(e.target.value)}>
            <option value="">เด็กเก่า/ใหม่ (ทั้งหมด)</option>
            <option value="เก่า">เก่า</option>
            <option value="ใหม่">ใหม่</option>
          </select>
          <select className="input" value={disability1} onChange={(e) => setDisability1(e.target.value)}>
            <option value="">ความพิการประเภทที่ 1</option>
            {DISABILITY_TYPES.map((d) => (
              <option key={d} value={d}>ประเภท {d}</option>
            ))}
          </select>
          <select className="input" value={disability2} onChange={(e) => setDisability2(e.target.value)}>
            <option value="">ความพิการประเภทที่ 2</option>
            {DISABILITY_TYPES.map((d) => (
              <option key={d} value={d}>ประเภท {d}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto rounded-xl sm:rounded-2xl lg:overflow-visible">
          <table className="table-base lg:[&_thead_th]:sticky lg:[&_thead_th]:top-16 lg:[&_thead_th]:z-20 lg:[&_thead_th]:shadow-sm">
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>รหัสบัตรประชาชน</th>
                <th>ชื่อ-นามสกุล</th>
                <th>ชื่อเล่น</th>
                <th>ประเภทความพิการ</th>
                <th>ชั้นเรียน</th>
                <th>เรือนนอน</th>
                <th>สถานะ</th>
                <th>เด็กเก่า/ใหม่</th>
                <th className="text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={10} className="text-center py-10">
                    <Loader2 className="inline-block h-5 w-5 animate-spin text-ksp-blue-500" />
                  </td>
                </tr>
              )}
              {!loading &&
                filteredStudents.map((s, index) => (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/patients/${s.id}`)}
                    className="cursor-pointer odd:bg-white even:bg-slate-50/80 transition-colors hover:bg-ksp-blue-50/40"
                  >
                    <td className="font-semibold text-ksp-gray">{index + 1}</td>
                    <td className="font-mono text-xs">{s.studentCode}</td>
                    <td>
                      <span className="font-medium text-ksp-blue-700">
                        {s.firstName} {s.lastName}
                      </span>
                    </td>
                    <td>{nicknameOf(s) || "-"}</td>
                    <td>{disabilityOf(s) || "-"}</td>
                    <td>{s.classRoom ?? "-"}</td>
                    <td>{s.dormitory ?? "-"}</td>
                    <td>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${studentStatusClass[s.studentStatus ?? "resident"]}`}
                      >
                        {studentStatusLabel[s.studentStatus ?? "resident"]}
                      </span>
                    </td>
                    <td>
                      {(() => {
                        const a = ageTypeOf(s);
                        if (!a) return <span className="text-ksp-gray">-</span>;
                        return (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                              a === "ใหม่"
                                ? "bg-sky-50 text-sky-700 ring-sky-100"
                                : "bg-amber-50 text-amber-700 ring-amber-100"
                            }`}
                          >
                            {a}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="text-right">
                      {isAdmin && (
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            className="btn-ghost px-2 py-1.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditing(s);
                              setFormOpen(true);
                            }}
                            title="แก้ไข"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="btn-ghost px-2 py-1.5 text-rose-600 hover:bg-rose-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleting(s);
                            }}
                            title="ลบข้อมูล"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!loading && filteredStudents.length === 0 && (
          <div className="p-6">
            <EmptyState
              icon={<Users className="h-7 w-7" />}
              title="ไม่พบรายชื่อนักเรียน"
              description={
                isAdmin
                  ? "ลองปรับตัวกรอง หรือกด 'เพิ่มนักเรียน' / 'นำเข้า Excel/CSV'"
                  : "ลองปรับตัวกรอง หรือติดต่อครูเรือนพยาบาล"
              }
            />
          </div>
        )}
        {!loading && filteredStudents.length > 0 && (
          <div className="border-t border-ksp-blue-50 px-4 py-3 text-sm text-ksp-gray">
            แสดง {filteredStudents.length.toLocaleString("th-TH")} จากทั้งหมด{" "}
            {total.toLocaleString("th-TH")} คน
          </div>
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={editing ? "แก้ไขข้อมูลนักเรียน" : "เพิ่มนักเรียนใหม่"}
        size="xxl"
      >
        <PatientForm
          initial={editing ?? undefined}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      </Modal>

      <PatientImport
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onCompleted={load}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="ยืนยันการลบข้อมูล"
        message={`ต้องการลบข้อมูลนักเรียน ${deleting?.firstName} ${deleting?.lastName}? ระบบจะลบข้อมูลนักเรียนและประวัติการรักษาที่ผูกอยู่แบบถาวร`}
        danger
        confirmLabel="ลบข้อมูล"
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
