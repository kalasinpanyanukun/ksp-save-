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
  Ruler,
  FileCheck2,
  Syringe,
  Activity,
  Home,
  NotebookText,
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

      <HealthDetailSections data={student.healthData} />
      <MedicationDetailSections data={student.medicationData} />

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

interface DetailItem {
  label: string;
  value: string;
}

function DetailSectionCard({
  title,
  Icon,
  items,
}: {
  title: string;
  Icon: typeof ClipboardList;
  items: DetailItem[];
}) {
  const visible = items.filter((item) => item.value && item.value !== "-");
  return (
    <section className="card-pad">
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-ksp-navy">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-ksp-blue-50 text-ksp-blue-700">
          <Icon className="h-4 w-4" />
        </span>
        {title}
      </h3>
      {visible.length === 0 ? (
        <p className="text-sm text-ksp-gray">ยังไม่มีข้อมูล</p>
      ) : (
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          {visible.map((item) => (
            <div key={item.label} className="rounded-lg bg-slate-50 px-3 py-2">
              <dt className="text-xs text-ksp-gray">{item.label}</dt>
              <dd className="font-medium leading-relaxed text-ksp-navy">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

function HealthDetailSections({ data }: { data: Record<string, unknown> }) {
  const record = isPlainObject(data) ? data : {};
  const sections = [
    {
      title: "ข้อมูลทะเบียน",
      Icon: ClipboardList,
      items: [
        { label: "เลขบัตรประชาชน", value: valueFrom(record, ["เลขบัตรประชาชน"]) },
        { label: "ชื่อเล่น", value: valueFrom(record, ["ชื่อเล่น"]) },
        { label: "ประเภทความพิการ", value: valueFrom(record, ["ประเภท ความพิการ", "ประเภท"]) },
        { label: "เด็กเก่า/ใหม่", value: valueFrom(record, ["เด็กเก่า/ใหม่"]) },
        { label: "วันเดือนปีเกิด", value: valueFrom(record, ["วันเดือนปีเกิด"]) },
        { label: "วันรายงานตัว", value: valueFrom(record, ["วันและเวลา มารายงานตัว", "วันและเวลา"]) },
      ],
    },
    {
      title: "ที่อยู่และผู้ปกครอง",
      Icon: Home,
      items: [
        { label: "ชื่อผู้ปกครอง", value: valueFrom(record, ["ชื่อผู้ปกครอง"]) },
        { label: "เบอร์โทร 1", value: valueFrom(record, ["เบอร์โทร 1"]) },
        { label: "เบอร์โทร 2", value: valueFrom(record, ["เบอร์โทร 2"]) },
        { label: "ที่อยู่", value: valueFrom(record, ["ที่อยู่"]) },
      ],
    },
    {
      title: "สัดส่วนและ BMI",
      Icon: Ruler,
      items: [
        { label: "น้ำหนัก", value: valueFrom(record, ["น้ำหนัก (กิโลกรัม)", "น้ำหนัก"]) },
        { label: "ส่วนสูง", value: valueFrom(record, ["ส่วนสูง (เซนติเมตร)", "ส่วนสูง"]) },
        { label: "คะแนน BMI", value: valueFrom(record, ["คะแนน BMI", "คะแนน"]) },
        { label: "แปลผล BMI", value: valueFrom(record, ["แปลผล BMI", "แปลผล"]) },
      ],
    },
    {
      title: "สิทธิและเอกสาร",
      Icon: FileCheck2,
      items: [
        { label: "สิทธิ", value: valueFrom(record, ["สิทธิ"]) },
        { label: "ฝากบัตรประชาชน", value: valueFrom(record, ["ฝากบัตรประชาชน กด ✓", "ฝากบัตรประชาชน"]) },
        { label: "ฝากบัตรคนพิการ", value: valueFrom(record, ["ฝากบัตรคนพิการ กด ✓", "ฝากบัตรคนพิการ"]) },
      ],
    },
    {
      title: "วัคซีน",
      Icon: Syringe,
      items: [
        {
          label: "วัคซีนพื้นฐาน",
          value: valueFrom(record, ["ได้รับวัคซีนพื้นฐาน(สมุดชมพู) ครบ/ไม่ครบ", "ได้รับวัคซีนพื้นฐาน(สมุดชมพู)"]),
        },
        { label: "ไข้หวัดใหญ่", value: valueFrom(record, ["ฉีดวัคซีน ป้องกันไข้หวัดใหญ่ (ปี)", "ป้องกันไข้หวัดใหญ่ (ปี)"]) },
        { label: "โควิด", value: valueFrom(record, ["ฉีดวัคซีน ป้องกันโควิค (ปี)", "ป้องกันโควิค (ปี)"]) },
      ],
    },
    {
      title: "สุขภาพและการแพ้",
      Icon: Activity,
      items: [
        { label: "โรคประจำตัว", value: valueFrom(record, ["โรคประจำตัว"]) },
        { label: "ยาประจำตัว", value: valueFrom(record, ["ยาประจำตัว ถ้ามีกด ✓", "ยาประจำตัว"]) },
        { label: "แพ้ยา/อาหาร", value: valueFrom(record, ["แพ้ยา/อาหาร แพ้ระบุ/ไม่แพ้ -", "แพ้ยา/อาหาร"]) },
        { label: "อาการแสดงการแพ้", value: valueFrom(record, ["อาการแสดงการแพ้"]) },
        { label: "ผลตรวจร่างกาย", value: valueFrom(record, ["ผลตรวจร่างกาย"]) },
      ],
    },
    {
      title: "หมายเหตุ",
      Icon: NotebookText,
      items: [{ label: "หมายเหตุ", value: valueFrom(record, ["หมายเหตุ"]) }],
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
      {sections.map((section) => (
        <DetailSectionCard key={section.title} {...section} />
      ))}
    </div>
  );
}

function MedicationDetailSections({ data }: { data: Record<string, unknown> }) {
  const record = isPlainObject(data) ? data : {};
  const medicationRows = Array.isArray(record["รายการยา"])
    ? (record["รายการยา"] as Record<string, unknown>[])
    : [];

  return (
    <section className="card-pad mb-6">
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-ksp-navy">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-ksp-blue-50 text-ksp-blue-700">
          <Pill className="h-4 w-4" />
        </span>
        รายละเอียดยาประจำตัวจากเรือนนอน
      </h3>
      {medicationRows.length === 0 ? (
        <p className="text-sm text-ksp-gray">ยังไม่มีข้อมูลยาประจำตัวจากชีตต้นทาง</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {medicationRows.map((row, index) => (
            <div
              key={index}
              className="rounded-lg border border-ksp-blue-50 bg-white p-3 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="font-semibold text-ksp-navy">
                  {valueFrom(row, ["ข้อมูลยา ชื่อยา", "ชื่อยา"])}
                </div>
                <span className="chip-blue">รายการที่ {index + 1}</span>
              </div>
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {[
                  { label: "ชื่อรอง", value: valueFrom(row, ["ข้อมูลยา ชื่อรอง", "ชื่อรอง"]) },
                  { label: "ชนิดยา", value: valueFrom(row, ["ข้อมูลยา ชนิดยา", "ชนิดยา"]) },
                  { label: "ขนาดยา", value: valueFrom(row, ["ข้อมูลยา ขนาดยา", "ขนาดยา"]) },
                  { label: "จำนวน", value: valueFrom(row, ["ข้อมูลยา จำนวน (หน่วย)", "จำนวน (หน่วย)"]) },
                  { label: "เช้า", value: valueFrom(row, ["การรับประทาน เช้า", "เช้า"]) },
                  { label: "เที่ยง", value: valueFrom(row, ["การรับประทาน เที่ยง", "เที่ยง"]) },
                  { label: "เย็น", value: valueFrom(row, ["การรับประทาน เย็น", "เย็น"]) },
                  { label: "ก่อนนอน", value: valueFrom(row, ["การรับประทาน ก่อนนอน", "ก่อนนอน"]) },
                  { label: "หมายเหตุ", value: valueFrom(row, ["หมายเหตุ"]) },
                ]
                  .filter((item) => item.value !== "-")
                  .map((item) => (
                    <div key={item.label} className="rounded-lg bg-slate-50 px-3 py-2">
                      <dt className="text-xs text-ksp-gray">{item.label}</dt>
                      <dd className="font-medium text-ksp-navy">{item.value}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          ))}
        </div>
      )}
    </section>
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
