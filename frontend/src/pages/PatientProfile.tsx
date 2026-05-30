import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Edit3, Loader2 } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Modal from "../components/common/Modal";
import PatientForm from "../components/patients/PatientForm";
import StudentDetailBody from "../components/patients/StudentDetailBody";
import { useAppSelector } from "../store";
import { useToast } from "../components/common/useToast";
import {
  getStudent,
  updateStudent,
  type StudentDetail,
  type StudentInput,
} from "../services/studentsService";

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const role = useAppSelector((s) => s.auth.user?.role);
  const isAdmin = role === "super_admin" || role === "admin";
  const toast = useToast();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setStudent(await getStudent(id));
    } catch {
      toast("โหลดข้อมูลนักเรียนไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(data: StudentInput) {
    if (!student) return;
    setSubmitting(true);
    try {
      await updateStudent(student.id, data);
      toast("อัปเดตข้อมูลเรียบร้อย", "success");
      setEditing(false);
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

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-ksp-blue-500" />
      </div>
    );
  }

  if (!student) {
    return <EmptyState title="ไม่พบข้อมูลนักเรียน" />;
  }

  return (
    <>
      <PageHeader
        title={`${student.firstName} ${student.lastName}`}
        description={`รหัส ${student.studentCode} · ${student.classRoom ?? "-"} · ${student.dormitory ?? "-"}`}
        actions={
          <>
            <Link to="/patients" className="btn-outline">
              <ArrowLeft className="h-4 w-4" /> กลับ
            </Link>
            {isAdmin && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setEditing(true)}
              >
                <Edit3 className="h-4 w-4" /> แก้ไขข้อมูล
              </button>
            )}
          </>
        }
      />

      <StudentDetailBody student={student} showStatusBadge />

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="แก้ไขข้อมูลนักเรียน"
        size="lg"
      >
        <PatientForm
          initial={student}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(false)}
        />
      </Modal>
    </>
  );
}
