import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import { useAppSelector } from "../store";
import { useToast } from "../components/common/useToast";
import {
  createStudent,
  deactivateStudent,
  fetchClassrooms,
  fetchDormitories,
  listStudents,
  updateStudent,
  type StudentInput,
} from "../services/studentsService";
import type { Student } from "../types";

export default function PatientListPage() {
  const role = useAppSelector((s) => s.auth.user?.role);
  const isAdmin = role === "super_admin" || role === "admin";
  const toast = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [dormFilter, setDormFilter] = useState("");
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
      await deactivateStudent(deleting.id);
      toast("ปิดการใช้งานนักเรียนเรียบร้อย", "success");
      await load();
    } catch {
      toast("ไม่สามารถดำเนินการได้", "error");
    } finally {
      setDeleting(null);
    }
  }

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize],
  );

  return (
    <>
      <PageHeader
        title="นักเรียน / ผู้ป่วย"
        description={`ทั้งหมด ${total.toLocaleString("th-TH")} คน`}
        actions={
          isAdmin && (
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
          )
        }
      />

      <div className="card-pad mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-1">
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
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>รหัส</th>
                <th>ชื่อ-นามสกุล</th>
                <th>ชั้นเรียน</th>
                <th>เรือนนอน</th>
                <th>กรุปเลือด</th>
                <th>แพ้ยา</th>
                <th className="text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <Loader2 className="inline-block h-5 w-5 animate-spin text-ksp-blue-500" />
                  </td>
                </tr>
              )}
              {!loading &&
                students.map((s) => (
                  <tr key={s.id}>
                    <td className="font-mono text-xs">{s.studentCode}</td>
                    <td>
                      <Link
                        to={`/patients/${s.id}`}
                        className="font-medium text-ksp-blue-700 hover:underline"
                      >
                        {s.firstName} {s.lastName}
                      </Link>
                    </td>
                    <td>{s.classRoom ?? "-"}</td>
                    <td>{s.dormitory ?? "-"}</td>
                    <td>
                      <span className="chip-blue">
                        {s.bloodType === "unknown" ? "—" : s.bloodType}
                      </span>
                    </td>
                    <td className="max-w-[16ch] truncate" title={s.drugAllergy ?? ""}>
                      {s.drugAllergy || (
                        <span className="text-ksp-gray">ไม่มี</span>
                      )}
                    </td>
                    <td className="text-right">
                      {isAdmin && (
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            className="btn-ghost px-2 py-1.5"
                            onClick={() => {
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
                            onClick={() => setDeleting(s)}
                            title="ปิดการใช้งาน"
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
        {!loading && students.length === 0 && (
          <div className="p-6">
            <EmptyState
              icon={<Users className="h-7 w-7" />}
              title="ยังไม่มีรายชื่อนักเรียน"
              description={
                isAdmin
                  ? "เริ่มจากกด 'เพิ่มนักเรียน' หรือ 'นำเข้า Excel/CSV'"
                  : "ติดต่อครูเรือนพยาบาลเพื่อเพิ่มรายชื่อ"
              }
            />
          </div>
        )}
        {!loading && students.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-t border-ksp-blue-50 text-sm">
            <div className="text-ksp-gray">
              หน้า {page} / {totalPages}
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                className="btn-outline px-3 py-1.5 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ก่อนหน้า
              </button>
              <button
                type="button"
                className="btn-outline px-3 py-1.5 text-xs"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                ถัดไป
              </button>
            </div>
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
        size="lg"
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
        title="ยืนยันการปิดการใช้งาน"
        message={`ต้องการปิดการใช้งานนักเรียน ${deleting?.firstName} ${deleting?.lastName}? ระบบจะยังเก็บประวัติไว้แต่จะไม่แสดงในรายการหลัก`}
        danger
        confirmLabel="ปิดการใช้งาน"
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
