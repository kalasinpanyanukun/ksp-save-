import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  Loader2,
  Plus,
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Modal from "../components/common/Modal";
import StudentPicker from "../components/patients/StudentPicker";
import { useToast } from "../components/common/useToast";
import { useAppSelector } from "../store";
import { useTopbarSearch } from "../components/layout/TopbarSearchContext";
import {
  createStudentHandoff,
  getStudentHandoffSummary,
  listStudentHandoffs,
  type StudentHandoffInput,
  type StudentHandoffSummary,
} from "../services/studentHandoffsService";
import type { Student, StudentHandoff, StudentHandoffType } from "../types";

function todayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const typeLabels: Record<StudentHandoffType, string> = {
  check_in: "รับเข้าพักประจำ",
  check_out: "ลากลับบ้าน",
};

const typeTones: Record<StudentHandoffType, string> = {
  check_in: "bg-emerald-50 text-emerald-700 border-emerald-200",
  check_out: "bg-orange-50 text-orange-700 border-orange-200",
};

export default function StudentHandoffsPage() {
  const toast = useToast();
  const user = useAppSelector((s) => s.auth.user);
  const [items, setItems] = useState<StudentHandoff[]>([]);
  const [summary, setSummary] = useState<StudentHandoffSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<StudentHandoffType | "">("");
  const [from, setFrom] = useState(todayDate());
  const [to, setTo] = useState(todayDate());
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const pageSize = 20;

  const topbarSearch = useMemo(
    () => ({
      placeholder: "ค้นหานักเรียน / ผู้พามาส่ง / ครูพยาบาล",
      value: q,
      onChange: setQ,
    }),
    [q],
  );
  useTopbarSearch(topbarSearch);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        listStudentHandoffs({
          page,
          pageSize,
          q,
          from: from || undefined,
          to: to || undefined,
          type: typeFilter || undefined,
        }),
        getStudentHandoffSummary(),
      ]);
      setItems(list.data);
      setTotal(list.total);
      setSummary(sum);
    } catch {
      toast("โหลดข้อมูลรับ-ส่งนักเรียนไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  }, [from, page, q, to, typeFilter, toast]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [q, from, to, typeFilter]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total],
  );

  async function handleCreate(payload: StudentHandoffInput) {
    setSubmitting(true);
    try {
      await createStudentHandoff(payload);
      toast("บันทึกรับ-ส่งนักเรียนเรียบร้อย", "success");
      setOpen(false);
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
    <>
      <PageHeader
        title="บันทึกรับ-ส่งนักเรียน"
        description="รับนักเรียนเข้าพักประจำ และบันทึกนักเรียนลากลับบ้าน"
        actions={
          <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> บันทึกรายการใหม่
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-ksp-blue-100 shadow-card ring-1 ring-ksp-blue-100 md:grid-cols-3">
        <SummaryPanel
          title="วันนี้"
          checkIn={summary?.today.checkIn ?? 0}
          checkOut={summary?.today.checkOut ?? 0}
        />
        <SummaryPanel
          title="สัปดาห์นี้"
          checkIn={summary?.week.checkIn ?? 0}
          checkOut={summary?.week.checkOut ?? 0}
        />
        <SummaryPanel
          title="เดือนนี้"
          checkIn={summary?.month.checkIn ?? 0}
          checkOut={summary?.month.checkOut ?? 0}
        />
      </div>

      <div className="card-pad my-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
          <div>
            <label className="label">ประเภท</label>
            <select
              className="input"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as StudentHandoffType | "")}
            >
              <option value="">ทุกประเภท</option>
              <option value="check_in">รับเข้าพักประจำ</option>
              <option value="check_out">ลากลับบ้าน</option>
            </select>
          </div>
          <div>
            <label className="label">ตั้งแต่วันที่</label>
            <input
              type="date"
              className="input"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </div>
          <div>
            <label className="label">ถึงวันที่</label>
            <input
              type="date"
              className="input"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              setFrom("");
              setTo("");
              setTypeFilter("");
            }}
          >
            ทั้งหมด
          </button>
        </div>
      </div>

      <div>
        <section className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>วันที่ / เวลา</th>
                  <th>ประเภท</th>
                  <th>นักเรียน</th>
                  <th>ชั้น / เรือนนอน</th>
                  <th>ผู้พามาส่ง / รับกลับ</th>
                  <th>ครูพยาบาล</th>
                  <th>หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center">
                      <Loader2 className="inline h-5 w-5 animate-spin text-ksp-blue-500" />
                    </td>
                  </tr>
                )}
                {!loading &&
                  items.map((item) => (
                    <tr key={item.id}>
                      <td className="whitespace-nowrap">
                        <div className="font-semibold">{formatDate(item.handoffDate)}</div>
                        <div className="text-xs text-ksp-gray">{item.handoffTime}</div>
                      </td>
                      <td>
                        <span className={`chip border ${typeTones[item.handoffType]}`}>
                          {typeLabels[item.handoffType]}
                        </span>
                      </td>
                      <td>
                        <div className="font-semibold text-ksp-blue-700">
                          {item.student?.firstName} {item.student?.lastName}
                        </div>
                        <div className="text-xs text-ksp-gray">
                          {item.student?.studentCode}
                        </div>
                      </td>
                      <td>
                        <div>{item.student?.classRoom ?? "-"}</div>
                        <div className="text-xs text-ksp-gray">
                          {item.student?.dormitory ?? "-"}
                        </div>
                      </td>
                      <td>
                        <div className="font-medium">{item.companionName}</div>
                        <div className="text-xs text-ksp-gray">
                          {item.companionPhone || "-"}
                        </div>
                      </td>
                      <td>{item.nurseName || item.recordedBy?.fullName || "-"}</td>
                      <td className="max-w-[22ch] truncate" title={item.notes ?? ""}>
                        {item.notes || "-"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {!loading && items.length === 0 && (
            <div className="p-6">
              <EmptyState
                icon={<ArrowRightLeft className="h-7 w-7" />}
                title="ยังไม่มีบันทึกในช่วงวันที่นี้"
                description="กดบันทึกรายการใหม่เมื่อมีการรับเข้าพักประจำหรือลากลับบ้าน"
              />
            </div>
          )}
          {!loading && items.length > 0 && (
            <div className="flex items-center justify-between gap-2 border-t border-ksp-blue-50 px-4 py-3 text-sm">
              <div className="text-ksp-gray">
                หน้า {page} / {totalPages} · ทั้งหมด {total.toLocaleString("th-TH")} รายการ
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="btn-outline px-3 py-1.5 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  ก่อนหน้า
                </button>
                <button
                  type="button"
                  className="btn-outline px-3 py-1.5 text-xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  ถัดไป
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="บันทึกรับ-ส่งนักเรียน" size="lg">
        <StudentHandoffForm
          defaultNurseName={user?.fullName ?? ""}
          submitting={submitting}
          onSubmit={handleCreate}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}

function SummaryPanel({
  title,
  checkIn,
  checkOut,
}: {
  title: string;
  checkIn: number;
  checkOut: number;
}) {
  return (
    <section className="bg-white p-5">
      <div className="text-sm font-semibold text-ksp-gray">{title}</div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
            <ArrowDownToLine className="h-4 w-4" /> รับเข้า
          </div>
          <div className="mt-1 text-4xl font-extrabold text-emerald-700">
            {checkIn}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-orange-700">
            <ArrowUpFromLine className="h-4 w-4" /> ลากลับ
          </div>
          <div className="mt-1 text-4xl font-extrabold text-orange-700">
            {checkOut}
          </div>
        </div>
      </div>
    </section>
  );
}

function StudentHandoffForm({
  defaultNurseName,
  submitting,
  onSubmit,
  onCancel,
}: {
  defaultNurseName: string;
  submitting?: boolean;
  onSubmit: (payload: StudentHandoffInput) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [student, setStudent] = useState<Student | null>(null);
  const [handoffType, setHandoffType] = useState<StudentHandoffType>("check_in");
  const [handoffDate, setHandoffDate] = useState(todayDate());
  const [handoffTime, setHandoffTime] = useState(nowTime());
  const [companionName, setCompanionName] = useState("");
  const [companionPhone, setCompanionPhone] = useState("");
  const [nurseName, setNurseName] = useState(defaultNurseName);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!student) {
      setError("กรุณาเลือกนักเรียน");
      return;
    }
    if (!companionName.trim()) {
      setError("กรุณาระบุผู้พามาส่ง/รับกลับ");
      return;
    }
    setError(null);
    await onSubmit({
      studentId: student.id,
      handoffType,
      handoffDate,
      handoffTime,
      companionName: companionName.trim(),
      companionPhone: companionPhone.trim() || null,
      nurseName: nurseName.trim() || defaultNurseName,
      notes: notes.trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="label">นักเรียน *</label>
        <StudentPicker value={student} onChange={setStudent} />
      </div>

      <div>
        <label className="label">ประเภท *</label>
        <div className="grid grid-cols-2 gap-2">
          {(["check_in", "check_out"] as const).map((type) => (
            <button
              key={type}
              type="button"
              className={`rounded-xl border px-3 py-3 text-sm font-bold transition-colors ${
                handoffType === type
                  ? type === "check_in"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-orange-500 bg-orange-50 text-orange-800"
                  : "border-slate-200 bg-white text-ksp-navy hover:bg-ksp-blue-50"
              }`}
              onClick={() => setHandoffType(type)}
            >
              {typeLabels[type]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">วันที่ *</label>
          <input
            type="date"
            className="input"
            value={handoffDate}
            onChange={(event) => setHandoffDate(event.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">เวลา *</label>
          <input
            type="time"
            className="input"
            value={handoffTime}
            onChange={(event) => setHandoffTime(event.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">
            {handoffType === "check_in" ? "ผู้พามาส่ง *" : "ผู้รับกลับบ้าน *"}
          </label>
          <input
            className="input"
            value={companionName}
            onChange={(event) => setCompanionName(event.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">เบอร์โทร</label>
          <input
            className="input"
            value={companionPhone}
            onChange={(event) => setCompanionPhone(event.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label">ครูพยาบาลผู้รับรายงานตัว / รับกลับ *</label>
        <input
          className="input"
          value={nurseName}
          onChange={(event) => setNurseName(event.target.value)}
          required
        />
      </div>

      <div>
        <label className="label">หมายเหตุ</label>
        <textarea
          className="input min-h-[72px]"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2 border-t border-ksp-blue-50 pt-3 max-sm:[&_button]:w-full">
        <button type="button" className="btn-outline" onClick={onCancel}>
          ยกเลิก
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </form>
  );
}
