import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, Eye, Loader2, Plus, Send, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import ReferralForm from "../components/visits/ReferralForm";
import { useToast } from "../components/common/useToast";
import {
  createReferral,
  deleteReferral,
  listReferrals,
  updateReferral,
  type ReferralInput,
} from "../services/visitsService";
import type { Referral } from "../types";

export default function ReferralsPage() {
  const toast = useToast();
  const [items, setItems] = useState<Referral[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Referral | null>(null);
  const [selected, setSelected] = useState<Referral | null>(null);
  const [deleting, setDeleting] = useState<Referral | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pageSize = 100;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listReferrals({ page, pageSize });
      setItems(res.data);
      setTotal(res.total);
    } catch {
      toast("โหลดข้อมูลไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total],
  );

  async function handleSave(payload: ReferralInput) {
    setSubmitting(true);
    try {
      if (editing) {
        await updateReferral(editing.id, payload);
        toast("แก้ไขการส่งต่อเรียบร้อย", "success");
      } else {
        await createReferral(payload);
        toast("บันทึกการส่งต่อเรียบร้อย", "success");
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

  return (
    <>
      <PageHeader
        title="การส่งต่อโรงพยาบาล"
        description="บันทึกและติดตามการส่งต่อนักเรียนไปโรงพยาบาล"
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> บันทึกการส่งต่อ
          </button>
        }
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>วันที่</th>
                <th>นักเรียน</th>
                <th>ชื่อเล่น</th>
                <th>ชั้น / เรือนนอน</th>
                <th>อาการ</th>
                <th>นำส่งที่</th>
                <th>การรักษาที่ให้</th>
                <th>ผู้บันทึก</th>
                <th className="text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="text-center py-6">
                    <Loader2 className="inline h-5 w-5 animate-spin text-ksp-blue-500" />
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((r) => (
                  <tr
                    key={r.id}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer"
                    onClick={() => setSelected(r)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelected(r);
                      }
                    }}
                  >
                    <td className="whitespace-nowrap">
                      <div>
                        {new Date(r.referralDate).toLocaleDateString("th-TH")}
                      </div>
                      <div className="text-xs text-ksp-gray">{r.referralTime}</div>
                    </td>
                    <td>
                      <div className="font-medium">
                        {r.student?.firstName} {r.student?.lastName}
                      </div>
                      <div className="text-xs text-ksp-gray">
                        {r.student?.studentCode}
                      </div>
                    </td>
                    <td className="font-medium">{r.student?.nickname || "-"}</td>
                    <td>
                      <div>{r.student?.classRoom ?? "-"}</div>
                      <div className="text-xs text-ksp-gray">
                        {r.student?.dormitory ?? "-"}
                      </div>
                    </td>
                    <td className="max-w-[20ch] truncate" title={r.chiefComplaint}>
                      {r.chiefComplaint}
                    </td>
                    <td>
                      <span className="chip-blue">{r.referredTo}</span>
                    </td>
                    <td className="max-w-[20ch] truncate" title={r.treatmentGiven ?? ""}>
                      {r.treatmentGiven || "-"}
                    </td>
                    <td className="text-xs text-ksp-gray">
                      {r.recordedBy?.fullName ?? "-"}
                    </td>
                    <td className="whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          className="btn-ghost px-2 py-2 text-ksp-blue-700 hover:bg-ksp-blue-50"
                          title="ดูรายละเอียด"
                          aria-label="ดูรายละเอียดการส่งต่อ"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelected(r);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="btn-ghost px-2 py-2 text-ksp-blue-700 hover:bg-ksp-blue-50"
                          title="แก้ไข"
                          aria-label="แก้ไขการส่งต่อ"
                          onClick={(event) => {
                            event.stopPropagation();
                            setEditing(r);
                            setOpen(true);
                          }}
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="btn-ghost px-2 py-2 text-rose-600 hover:bg-rose-50"
                          title="ลบข้อมูล"
                          aria-label="ลบการส่งต่อ"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleting(r);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!loading && items.length === 0 && (
          <div className="p-6">
            <EmptyState
              icon={<Send className="h-7 w-7" />}
              title="ยังไม่มีการส่งต่อ"
              description="กดปุ่ม 'บันทึกการส่งต่อ' เมื่อต้องส่งนักเรียนไปรับการรักษาที่โรงพยาบาล"
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
      </div>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing ? "แก้ไขการส่งต่อโรงพยาบาล" : "บันทึกการส่งต่อโรงพยาบาล"}
        size="lg"
      >
        <ReferralForm
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
        title="รายละเอียดการส่งต่อ"
        size="lg"
      >
        {selected && (
          <ReferralDetail
            item={selected}
            onEdit={() => {
              setEditing(selected);
              setSelected(null);
              setOpen(true);
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="ยืนยันการลบการส่งต่อ"
        message={`ต้องการลบบันทึกส่งต่อของ ${deleting?.student?.firstName ?? ""} ${deleting?.student?.lastName ?? ""} ใช่หรือไม่?`}
        danger
        confirmLabel="ลบข้อมูล"
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteReferral(deleting.id);
            toast("ลบการส่งต่อเรียบร้อย", "success");
            await load();
          } catch {
            toast("ลบการส่งต่อไม่สำเร็จ", "error");
          } finally {
            setDeleting(null);
          }
        }}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

function ReferralDetail({
  item,
  onEdit,
}: {
  item: Referral;
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
        <DetailCell label="วันที่ / เวลา" value={`${new Date(item.referralDate).toLocaleDateString("th-TH")} · ${item.referralTime}`} />
        <DetailCell label="นำส่งที่" value={item.referredTo} />
        <DetailCell label="อาการ" value={item.chiefComplaint} wide />
        <DetailCell label="การรักษาเบื้องต้นที่ให้" value={item.treatmentGiven || "-"} wide />
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
