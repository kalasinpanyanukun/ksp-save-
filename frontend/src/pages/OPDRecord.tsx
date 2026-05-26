import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Loader2, Stethoscope, Calendar } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Modal from "../components/common/Modal";
import OPDForm from "../components/visits/OPDForm";
import { useToast } from "../components/common/useToast";
import { createVisit, listVisits, type OpdInput } from "../services/visitsService";
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
  const pageSize = 20;
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(todayDate());
  const [open, setOpen] = useState(false);
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
      await createVisit(payload);
      toast("บันทึก OPD เรียบร้อย", "success");
      setOpen(false);
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

  return (
    <>
      <PageHeader
        title="OPD - บันทึกการรักษา"
        description={`บันทึกการเข้าใช้บริการของวันที่เลือก`}
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-4 w-4" /> บันทึกใหม่
          </button>
        }
      />

      <div className="card-pad mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-ksp-gray" />
          <input
            type="date"
            className="input max-w-[200px]"
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
          <div className="ml-auto text-sm text-ksp-gray">
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
                <th>ชั้น / เรือนนอน</th>
                <th>อาการ</th>
                <th>วินิจฉัย</th>
                <th>ผู้บันทึก</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <Loader2 className="inline h-5 w-5 animate-spin text-ksp-blue-500" />
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((v) => (
                  <tr key={v.id}>
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
        onClose={() => setOpen(false)}
        title="บันทึก OPD"
        size="lg"
      >
        <OPDForm
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          submitting={submitting}
        />
      </Modal>
    </>
  );
}
