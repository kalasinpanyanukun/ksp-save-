import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, Eye, Loader2, Plus, Stethoscope, Calendar, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import OPDForm from "../components/visits/OPDForm";
import { useToast } from "../components/common/useToast";
import {
  createVisit,
  deleteVisit,
  listVisits,
  updateVisit,
  type OpdInput,
} from "../services/visitsService";
import type { OpdVisit } from "../types";

function todayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function OPDRecordPage() {
  const toast = useToast();
  const [items, setItems] = useState<OpdVisit[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 100;
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(todayDate());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OpdVisit | null>(null);
  const [selected, setSelected] = useState<OpdVisit | null>(null);
  const [deleting, setDeleting] = useState<OpdVisit | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listVisits({
        date: date || undefined,
        page,
        pageSize,
      });
      setItems(res.data);
      setTotal(res.total);
    } catch {
      toast("โหลดบันทึก OPD ไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  }, [date, page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(payload: OpdInput) {
    setSubmitting(true);
    try {
      if (editing) {
        await updateVisit(editing.id, payload);
        toast("แก้ไข OPD เรียบร้อย", "success");
      } else {
        await createVisit(payload);
        toast("บันทึก OPD เรียบร้อย", "success");
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

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total],
  );

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(item: OpdVisit) {
    setSelected(null);
    setEditing(item);
    setOpen(true);
  }

  return (
    <>
      <PageHeader
        title="OPD - บันทึกการรักษา"
        description={`บันทึกการเข้าใช้บริการของวันที่เลือก`}
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" /> บันทึกใหม่
          </button>
        }
      />

      <div className="card-pad mb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_12rem_auto_1fr] sm:items-center">
          <Calendar className="hidden h-4 w-4 text-ksp-gray sm:block" />
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button
            type="button"
            className="btn-outline"
            onClick={() => setDate("")}
          >
            ทั้งหมด
          </button>
          <div className="text-sm text-ksp-gray sm:ml-auto">
            ทั้งหมด {total} รายการ
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>วันที่ / เวลา</th>
                <th>นักเรียน</th>
                <th>ชื่อเล่น</th>
                <th>ชั้น / เรือนนอน</th>
                <th>อาการ</th>
                <th>วินิจฉัย</th>
                <th>ผู้บันทึก</th>
                <th className="text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center py-8">
                    <Loader2 className="inline h-5 w-5 animate-spin text-ksp-blue-500" />
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((v) => (
                  <tr
                    key={v.id}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer"
                    onClick={() => setSelected(v)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelected(v);
                      }
                    }}
                  >
                    <td className="whitespace-nowrap">
                      <div className="font-medium">
                        {new Date(v.visitDate).toLocaleDateString("th-TH")}
                      </div>
                      <div className="text-xs text-ksp-gray">{v.visitTime}</div>
                    </td>
                    <td>
                      <div className="font-medium">
                        {v.student?.firstName} {v.student?.lastName}
                      </div>
                      <div className="text-xs text-ksp-gray">
                        {v.student?.studentCode}
                      </div>
                    </td>
                    <td className="font-medium">{v.student?.nickname || "-"}</td>
                    <td>
                      <div>{v.student?.classRoom ?? "-"}</div>
                      <div className="text-xs text-ksp-gray">
                        {v.student?.dormitory ?? "-"}
                      </div>
                    </td>
                    <td className="max-w-[24ch] truncate" title={v.chiefComplaint}>
                      {v.chiefComplaint}
                    </td>
                    <td className="max-w-[24ch] truncate" title={v.diagnosis ?? ""}>
                      {v.diagnosis || "-"}
                    </td>
                    <td className="text-xs text-ksp-gray">
                      {v.recordedBy?.fullName ?? "-"}
                    </td>
                    <td className="whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          className="btn-ghost px-2 py-2 text-ksp-blue-700 hover:bg-ksp-blue-50"
                          title="ดูรายละเอียด"
                          aria-label="ดูรายละเอียด OPD"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelected(v);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="btn-ghost px-2 py-2 text-ksp-blue-700 hover:bg-ksp-blue-50"
                          title="แก้ไข"
                          aria-label="แก้ไข OPD"
                          onClick={(event) => {
                            event.stopPropagation();
                            openEdit(v);
                          }}
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="btn-ghost px-2 py-2 text-rose-600 hover:bg-rose-50"
                          title="ลบข้อมูล"
                          aria-label="ลบ OPD"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleting(v);
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
              icon={<Stethoscope className="h-7 w-7" />}
              title="ยังไม่มีบันทึก OPD"
              description="กดปุ่ม 'บันทึกใหม่' เพื่อเริ่ม"
            />
          </div>
        )}
        {!loading && items.length > 0 && (
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-ksp-blue-50 text-sm">
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
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing ? "แก้ไข OPD" : "บันทึก OPD"}
        size="lg"
      >
        <OPDForm
          initial={editing}
          onSubmit={handleSubmit}
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
        title="รายละเอียด OPD"
        size="lg"
      >
        {selected && (
          <OpdDetail
            item={selected}
            onEdit={() => openEdit(selected)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="ยืนยันการลบ OPD"
        message={`ต้องการลบบันทึก OPD ของ ${deleting?.student?.firstName ?? ""} ${deleting?.student?.lastName ?? ""} ใช่หรือไม่?`}
        danger
        confirmLabel="ลบข้อมูล"
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteVisit(deleting.id);
            toast("ลบ OPD เรียบร้อย", "success");
            await load();
          } catch {
            toast("ลบ OPD ไม่สำเร็จ", "error");
          } finally {
            setDeleting(null);
          }
        }}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

function OpdDetail({
  item,
  onEdit,
}: {
  item: OpdVisit;
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
        <DetailCell label="วันที่ / เวลา" value={`${new Date(item.visitDate).toLocaleDateString("th-TH")} · ${item.visitTime}`} />
        <DetailCell label="ผู้บันทึก" value={item.recordedBy?.fullName ?? "-"} />
        <DetailCell label="อาการ" value={item.chiefComplaint} wide />
        <DetailCell label="วินิจฉัย" value={item.diagnosis || "-"} />
        <DetailCell label="การรักษา" value={item.treatment || "-"} />
        <DetailCell
          label="ยา / เวชภัณฑ์ที่จ่าย"
          value={
            item.medications.length
              ? item.medications
                  .map((med) => `${med.drugName}${med.dose ? ` ${med.dose}` : ""}${med.qty ? ` (${med.qty})` : ""}`)
                  .join("\n")
              : "-"
          }
          wide
        />
        <DetailCell label="หมายเหตุ" value={item.notes || "-"} wide />
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
