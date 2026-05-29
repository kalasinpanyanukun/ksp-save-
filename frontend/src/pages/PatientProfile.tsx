import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  Stethoscope,
  BedDouble,
  Send,
  Edit3,
  Loader2,
  ClipboardList,
  Pill,
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Modal from "../components/common/Modal";
import PatientForm from "../components/patients/PatientForm";
import { useAppSelector } from "../store";
import { useToast } from "../components/common/useToast";
import {
  getStudent,
  updateStudent,
  type StudentDetail,
  type StudentInput,
} from "../services/studentsService";
import type { Admission } from "../types";

function formatDate(date: string | null | undefined) {
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
      const s = await getStudent(id);
      setStudent(s);
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
      <div className="grid place-items-center min-h-[40vh]">
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
        description={`รหัส ${student.studentCode}`}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card-pad">
          <h3 className="font-semibold text-ksp-navy flex items-center gap-2">
            <User className="h-4 w-4" /> ข้อมูลพื้นฐาน
          </h3>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ksp-gray">ชั้นเรียน</dt>
              <dd className="font-medium">{student.classRoom ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ksp-gray">เรือนนอน</dt>
              <dd className="font-medium">{student.dormitory ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ksp-gray">ครูประจำชั้น</dt>
              <dd className="font-medium">{student.homeroomTeacher ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ksp-gray">กรุปเลือด</dt>
              <dd>
                <span className="chip-blue">
                  {student.bloodType === "unknown" ? "—" : student.bloodType}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="card-pad">
          <h3 className="font-semibold text-ksp-navy flex items-center gap-2">
            <Stethoscope className="h-4 w-4" /> ข้อมูลสุขภาพ
          </h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-ksp-gray">โรคประจำตัว</dt>
              <dd className="font-medium">
                {student.congenitalDisease || "ไม่มี"}
              </dd>
            </div>
            <div>
              <dt className="text-ksp-gray">การแพ้ยา</dt>
              <dd className="font-medium text-rose-700">
                {student.drugAllergy || "ไม่มี"}
              </dd>
            </div>
            <div>
              <dt className="text-ksp-gray">ยาประจำตัว</dt>
              <dd className="font-medium">
                {student.regularMedication || "ไม่มี"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="card-pad">
          <h3 className="font-semibold text-ksp-navy flex items-center gap-2">
            <Phone className="h-4 w-4" /> ผู้ปกครอง
          </h3>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ksp-gray">ชื่อ</dt>
              <dd className="font-medium">{student.parentName ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ksp-gray">เบอร์โทร</dt>
              <dd className="font-medium">
                {student.parentPhone ? (
                  <a
                    href={`tel:${student.parentPhone}`}
                    className="text-ksp-blue-700 hover:underline"
                  >
                    {student.parentPhone}
                  </a>
                ) : (
                  "-"
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <SheetDetailCard
          title="รายละเอียดสุขภาพจากเรือนนอน"
          Icon={ClipboardList}
          data={student.healthData}
        />
        <SheetDetailCard
          title="รายละเอียดยาประจำตัวจากเรือนนอน"
          Icon={Pill}
          data={student.medicationData}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
          title="ประวัติการ admit"
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
      </div>

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatDetailValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return `${value.length.toLocaleString("th-TH")} รายการ`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function SheetDetailCard({
  title,
  Icon,
  data,
}: {
  title: string;
  Icon: typeof ClipboardList;
  data: Record<string, unknown>;
}) {
  const entries = isPlainObject(data)
    ? Object.entries(data).filter(([, value]) => {
        if (Array.isArray(value)) return value.length > 0;
        return value !== null && value !== undefined && value !== "";
      })
    : [];
  const medicationRows = Array.isArray(data?.["รายการยา"])
    ? (data["รายการยา"] as Record<string, unknown>[])
    : [];

  return (
    <div className="card-pad">
      <h3 className="font-semibold text-ksp-navy flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4" /> {title}
      </h3>
      {entries.length === 0 ? (
        <p className="text-sm text-ksp-gray">ยังไม่มีข้อมูลจากชีตต้นทาง</p>
      ) : medicationRows.length > 0 ? (
        <div className="space-y-3">
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {entries
              .filter(([key]) => key !== "รายการยา")
              .map(([key, value]) => (
                <div key={key} className="rounded-lg bg-ksp-blue-50/50 px-3 py-2">
                  <dt className="text-xs text-ksp-gray">{key}</dt>
                  <dd className="font-medium text-ksp-navy">
                    {formatDetailValue(value)}
                  </dd>
                </div>
              ))}
          </dl>
          <div className="max-h-72 overflow-auto rounded-xl border border-ksp-blue-50">
            <table className="min-w-full text-left text-xs">
              <tbody className="divide-y divide-ksp-blue-50">
                {medicationRows.map((row, index) => (
                  <tr key={index}>
                    <td className="w-12 px-3 py-2 font-semibold text-ksp-blue-700">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2 text-ksp-navy/85">
                      {Object.entries(row)
                        .filter(([, value]) => Boolean(value))
                        .map(([key, value]) => `${key}: ${formatDetailValue(value)}`)
                        .join(" | ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          {entries.map(([key, value]) => (
            <div key={key} className="rounded-lg bg-ksp-blue-50/50 px-3 py-2">
              <dt className="text-xs text-ksp-gray">{key}</dt>
              <dd className="font-medium text-ksp-navy">
                {formatDetailValue(value)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

interface TimelineItem {
  id: string;
  date: string;
  time?: string;
  title: string;
  secondary?: string;
  recordedBy?: string;
}

interface TimelineCardProps {
  title: string;
  Icon: typeof Stethoscope;
  items: TimelineItem[];
}

function TimelineCard({ title, Icon, items }: TimelineCardProps) {
  return (
    <div className="card-pad">
      <h3 className="font-semibold text-ksp-navy flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4" /> {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-ksp-gray">ยังไม่มีประวัติ</p>
      ) : (
        <ol className="relative border-l-2 border-ksp-blue-100 pl-4 space-y-3 max-h-[28rem] overflow-y-auto pr-1">
          {items.map((i) => (
            <li key={i.id} className="relative">
              <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-ksp-blue-500 ring-4 ring-white" />
              <div className="text-xs text-ksp-gray flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {formatDate(i.date)}
                {i.time && ` · ${i.time}`}
                {i.recordedBy && ` · โดย ${i.recordedBy}`}
              </div>
              <div className="font-medium text-ksp-navy mt-0.5 text-sm">
                {i.title}
              </div>
              {i.secondary && (
                <div className="text-xs text-ksp-gray mt-0.5">{i.secondary}</div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
