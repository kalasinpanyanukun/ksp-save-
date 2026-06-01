import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Edit3, Loader2 } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Modal from "../components/common/Modal";
import PatientForm from "../components/patients/PatientForm";
import StudentDetailBody from "../components/patients/StudentDetailBody";
import PdfExportButton from "../components/common/PdfExportButton";
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
            <PdfExportButton getReport={() => studentReport(student)} label="ส่งออก PDF" />
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
        size="xxl"
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

function hv(student: StudentDetail, ...keys: string[]) {
  const d = student.healthData as Record<string, unknown> | undefined;
  if (!d) return "";
  for (const k of keys) {
    const v = d[k];
    const t = v === null || v === undefined ? "" : String(v).trim();
    if (t && t !== "-" && t.toUpperCase() !== "FALSE") return t;
  }
  return "";
}

const studentStatusLabel: Record<StudentDetail["studentStatus"], string> = {
  resident: "ประจำ",
  infirmary: "ป่วย(นอนเรือนบาล)",
  home_leave: "ลากลับบ้าน",
};

function studentReport(student: StudentDetail) {
  const guardians =
    Array.isArray(student.guardians) && student.guardians.length > 0
      ? student.guardians
      : student.parentName
        ? [{ name: student.parentName, phone: student.parentPhone ?? "" }]
        : [];
  const guardianText = guardians.map((g) => `${g.name} ${g.phone}`.trim()).join(" / ") || "-";
  const backupPhones = ["เบอร์โทร 1", "เบอร์โทร 2", "เบอร์โทร 3"]
    .map((k) => hv(student, k))
    .filter(Boolean)
    .join(" · ");

  const rows: [string, string][] = [
    ["รหัสนักเรียน", student.studentCode],
    ["เลขบัตรประชาชน", hv(student, "เลขบัตรประชาชน") || "-"],
    ["ชื่อ-สกุล", `${student.firstName} ${student.lastName}`],
    ["ชื่อเล่น", student.nickname || hv(student, "ชื่อเล่น") || "-"],
    ["สถานะ", studentStatusLabel[student.studentStatus]],
    ["วันเดือนปีเกิด", hv(student, "วันเดือนปีเกิด") || "-"],
    ["ประเภทความพิการ", hv(student, "ประเภท ความพิการ", "ประเภท") || "-"],
    ["เด็กเก่า/ใหม่", hv(student, "เด็กเก่า/ใหม่") || "-"],
    ["ชั้นเรียน", student.classRoom ?? "-"],
    ["เรือนนอน", student.dormitory ?? "-"],
    ["ครูประจำชั้น", `${student.homeroomTeacher ?? "-"} ${student.homeroomTeacherPhone ?? ""}`.trim()],
    ["ผู้ปกครอง", guardianText],
    ["เบอร์โทรสำรอง", backupPhones || "-"],
    ["ที่อยู่", hv(student, "ที่อยู่") || "-"],
    ["กรุ๊ปเลือด", student.bloodType === "unknown" ? "-" : student.bloodType],
    ["น้ำหนัก / ส่วนสูง", `${hv(student, "น้ำหนัก (กิโลกรัม)", "น้ำหนัก") || "-"} กก. / ${hv(student, "ส่วนสูง (เซนติเมตร)", "ส่วนสูง") || "-"} ซม.`],
    ["BMI", `${hv(student, "คะแนน BMI", "คะแนน") || "-"} (${hv(student, "แปลผล BMI", "แปลผล") || "-"})`],
    ["สิทธิการรักษา", hv(student, "สิทธิ") || "-"],
    ["วัคซีนพื้นฐาน", hv(student, "ได้รับวัคซีนพื้นฐาน(สมุดชมพู) ครบ/ไม่ครบ", "ได้รับวัคซีนพื้นฐาน(สมุดชมพู)") || "-"],
    ["โรคประจำตัว", student.congenitalDisease || "-"],
    ["แพ้ยา/อาหาร", student.drugAllergy || "-"],
    ["ยาประจำตัว", student.regularMedication || "-"],
    ["ประวัติ OPD", `${student.opdVisits.length} ครั้ง`],
    ["ประวัติการนอนพักรักษา", `${student.admissions.length} รายการ`],
    ["ประวัติการส่งต่อโรงพยาบาล", `${student.referrals.length} รายการ`],
  ];

  return {
    title: "ข้อมูลนักเรียนรายบุคคล",
    subtitle: `${student.firstName} ${student.lastName} · ${student.classRoom ?? "-"} · ${student.dormitory ?? "-"}`,
    orientation: "p" as const,
    fontSize: 14,
    columns: [
      { header: "รายการ", weight: 1.3 },
      { header: "ข้อมูล", weight: 2.7 },
    ],
    rows,
  };
}
