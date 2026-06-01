import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, Eye, Loader2, BedDouble, LogOut, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import AdmissionForm from "../components/visits/AdmissionForm";
import DischargeForm from "../components/visits/DischargeForm";
import { useToast } from "../components/common/useToast";
import {
  createAdmission,
  deleteAdmission,
  dischargeAdmission,
  listActiveAdmissions,
  listAdmissions,
  updateAdmission,
  type AdmissionInput,
} from "../services/visitsService";
import type { Admission, DischargeDestination } from "../types";

export default function AdmissionsPage() {
  const toast = useToast();
  const [active, setActive] = useState<Admission[]>([]);
  const [history, setHistory] = useState<Admission[]>([]);
  const [totalHistory, setTotalHistory] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Admission | null>(null);
  const [selected, setSelected] = useState<Admission | null>(null);
  const [deleting, setDeleting] = useState<Admission | null>(null);
  const [discharging, setDischarging] = useState<Admission | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pageSize = 100;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, all] = await Promise.all([
        listActiveAdmissions(),
        listAdmissions({ status: "discharged", page, pageSize }),
      ]);
      setActive(a);
      setHistory(all.data);
      setTotalHistory(all.total);
    } catch {
      toast("โหลดข้อมูล admission ไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalHistory / pageSize)),
    [totalHistory],
  );

  async function handleSave(payload: AdmissionInput) {
    setSubmitting(true);
    try {
      if (editing) {
        await updateAdmission(editing.id, payload);
        toast("แก้ไข admission เรียบร้อย", "success");
      } else {
        await createAdmission(payload);
        toast("บันทึก admission เรียบร้อย", "success");
      }
      setOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      const m =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "บันทึกไม่สำเร็จ";
      toast(m, "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDischarge(payload: {
    dischargeDate: string;
    dischargeTime: string;
    dischargeDestination: DischargeDestination;
    notes?: string | null;
  }) {
    if (!discharging) return;
    setSubmitting(true);
    try {
      await dischargeAdmission(discharging.id, payload);
      toast("จำหน่ายผู้ป่วยเรียบร้อย", "success");
      setDischarging(null);
      await load();
    } catch (err) {
      const m =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "บันทึกไม่สำเร็จ";
      toast(m, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="นอนพักรักษาตัวที่เรือนพยาบาล"
        description={`กำลัง admit ${active.length} คน`}
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> รับ admit ใหม่
          </button>
        }
      />

      <h2 className="font-semibold text-ksp-navy mb-3">กำลังพักรักษาอยู่</h2>
      {loading ? (
        <div className="card-pad text-center">
          <Loader2 className="inline h-5 w-5 animate-spin text-ksp-blue-500" />
        </div>
      ) : active.length === 0 ? (
        <EmptyState
          icon={<BedDouble className="h-7 w-7" />}
          title="ไม่มีผู้ป่วยกำลังนอนพัก"
          description="เมื่อมีการ admit จะแสดงในส่วนนี้"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {active.map((a) => (
            <div key={a.id} className="relative overflow-hidden rounded-xl bg-ksp-blue-800 p-5 text-white shadow-card">
              <div className="absolute right-[-2.9rem] top-5 w-44 rotate-45 bg-rose-600 py-1 text-center text-xs font-bold text-white shadow">
                กำลังพักรักษา
              </div>
              <div className="flex items-start justify-between gap-2 pr-16">
                <div className="min-w-0">
                  <div className="font-semibold text-white">
                    {a.student?.firstName} {a.student?.lastName}
                  </div>
                  <div className="text-xs font-medium text-white/75">
                    {a.student?.studentCode} · {a.student?.nickname || "ไม่มีชื่อเล่น"} · {a.student?.classRoom ?? "—"}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-sm font-medium text-white">
                {a.chiefComplaint}
              </div>
              <div className="mt-3 text-xs font-medium text-white/75">
                Admit:{" "}
                {new Date(a.admitDate).toLocaleDateString("th-TH")} · {a.admitTime}
              </div>
              <button
                type="button"
                className="btn mt-3 w-full border border-white bg-white text-ksp-blue-800 shadow-sm hover:bg-ksp-blue-50"
                onClick={() => setDischarging(a)}
              >
                <LogOut className="h-4 w-4" /> จำหน่าย
              </button>
            </div>
          ))}
        </div>
      )}

      <h2 className="font-semibold text-ksp-navy mt-8 mb-3">
        ประวัติ admission
      </h2>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>นักเรียน</th>
                <th>ชื่อเล่น</th>
                <th>ชั้น</th>
                <th>Admit</th>
                <th>Discharge</th>
                <th>จุดหมาย</th>
                <th>วันที่นอน</th>
                <th>อาการ</th>
                <th className="text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {history.map((a) => (
                <tr
                  key={a.id}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer"
                  onClick={() => setSelected(a)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelected(a);
                    }
                  }}
                >
                  <td>
                    <div className="font-medium">
                      {a.student?.firstName} {a.student?.lastName}
                    </div>
                    <div className="text-xs text-ksp-gray">
                      {a.student?.studentCode}
                    </div>
                  </td>
                  <td className="font-medium">{a.student?.nickname || "-"}</td>
                  <td>{a.student?.classRoom ?? "-"}</td>
                  <td className="text-xs">
                    {new Date(a.admitDate).toLocaleDateString("th-TH")}
                  </td>
                  <td className="text-xs">
                    {a.dischargeDate
                      ? new Date(a.dischargeDate).toLocaleDateString("th-TH")
                      : "-"}
                  </td>
                  <td>{dischargeLabel(a.dischargeDestination)}</td>
                  <td className="text-center">
                    {a.totalDays != null ? (
                      <span className="chip-blue">{a.totalDays} วัน</span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="max-w-[24ch] truncate" title={a.chiefComplaint}>
                    {a.chiefComplaint}
                  </td>
                  <td className="whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        className="btn-ghost px-2 py-2 text-ksp-blue-700 hover:bg-ksp-blue-50"
                        title="ดูรายละเอียด"
                        aria-label="ดูรายละเอียด admission"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelected(a);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="btn-ghost px-2 py-2 text-ksp-blue-700 hover:bg-ksp-blue-50"
                        title="แก้ไข"
                        aria-label="แก้ไข admission"
                        onClick={(event) => {
                          event.stopPropagation();
                          setEditing(a);
                          setOpen(true);
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="btn-ghost px-2 py-2 text-rose-600 hover:bg-rose-50"
                        title="ลบข้อมูล"
                        aria-label="ลบ admission"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleting(a);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {history.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-ksp-gray text-sm">
                    ยังไม่มีประวัติ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!loading && history.length > 0 && (
          <div className="flex items-center justify-between gap-2 border-t border-ksp-blue-50 px-4 py-3 text-sm">
            <div className="text-ksp-gray">
              หน้า {page} / {totalPages} · ทั้งหมด {totalHistory.toLocaleString("th-TH")} รายการ
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
      </div>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing ? "แก้ไข admission" : "รับ admit ใหม่"}
        size="lg"
      >
        <AdmissionForm
          initial={editing}
          onSubmit={handleSave}
          onCancel={() => {
            setOpen(false);
            setEditing(null);
          }}
          submitting={submitting}
        />
      </Modal>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="รายละเอียด admission"
        size="lg"
      >
        {selected && (
          <AdmissionDetail
            item={selected}
            onEdit={() => {
              setEditing(selected);
              setSelected(null);
              setOpen(true);
            }}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(discharging)}
        onClose={() => setDischarging(null)}
        title={`จำหน่าย ${discharging?.student?.firstName ?? ""} ${discharging?.student?.lastName ?? ""}`}
        size="md"
      >
        <DischargeForm
          onSubmit={handleDischarge}
          onCancel={() => setDischarging(null)}
          submitting={submitting}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="ยืนยันการลบ admission"
        message={`ต้องการลบประวัติ admission ของ ${deleting?.student?.firstName ?? ""} ${deleting?.student?.lastName ?? ""} ใช่หรือไม่?`}
        danger
        confirmLabel="ลบข้อมูล"
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteAdmission(deleting.id);
            toast("ลบ admission เรียบร้อย", "success");
            await load();
          } catch {
            toast("ลบ admission ไม่สำเร็จ", "error");
          } finally {
            setDeleting(null);
          }
        }}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

function AdmissionDetail({
  item,
  onEdit,
}: {
  item: Admission;
  onEdit: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-ksp-blue-50 px-4 py-3">
        <h2 className="text-xl font-bold text-ksp-navy">
          {item.student?.firstName} {item.student?.lastName}
          {item.student?.nickname ? (
            <span className="ml-2 text-base font-semibold text-ksp-blue-700">
              ({item.student.nickname})
            </span>
          ) : null}
        </h2>
        <p className="mt-1 text-sm font-medium text-ksp-blue-700">
          {item.student?.studentCode ?? "-"} · {item.student?.classRoom ?? "-"} · {item.student?.dormitory ?? "-"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DetailCell label="Admit" value={`${new Date(item.admitDate).toLocaleDateString("th-TH")} · ${item.admitTime}`} />
        <DetailCell
          label="Discharge"
          value={item.dischargeDate ? `${new Date(item.dischargeDate).toLocaleDateString("th-TH")} · ${item.dischargeTime ?? "-"}` : "-"}
        />
        <DetailCell label="จุดหมาย" value={dischargeLabel(item.dischargeDestination)} />
        <DetailCell label="วันที่นอน" value={item.totalDays != null ? `${item.totalDays} วัน` : "-"} />
        <DetailCell label="อาการ" value={item.chiefComplaint} wide />
        <DetailCell label="หมายเหตุ" value={item.notes || "-"} wide />
        <DetailCell label="ผู้บันทึก" value={item.recordedBy?.fullName ?? "-"} />
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-ksp-blue-50 pt-3">
        <button type="button" className="btn-outline" onClick={onEdit}>
          <Edit3 className="h-4 w-4" /> แก้ไข
        </button>
        {item.student?.id && (
          <Link to={`/patients/${item.student.id}`} className="btn-primary">
            ดูข้อมูลเพิ่มเติม
          </Link>
        )}
      </div>
    </div>
  );
}

function DetailCell({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-slate-100 bg-white px-3 py-2.5 ${wide ? "sm:col-span-2" : ""}`}>
      <div className="text-xs font-semibold text-ksp-gray">{label}</div>
      <div className="mt-1 whitespace-pre-wrap text-sm font-medium text-ksp-navy">{value}</div>
    </div>
  );
}

function dischargeLabel(d: DischargeDestination | null): string {
  if (!d) return "-";
  return {
    dormitory: "เรือนนอน",
    home: "บ้าน",
    hospital: "โรงพยาบาล",
    other: "อื่นๆ",
  }[d];
}
