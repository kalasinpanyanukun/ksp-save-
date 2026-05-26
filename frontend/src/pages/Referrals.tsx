import { useCallback, useEffect, useState } from "react";
import { Plus, Loader2, Send } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Modal from "../components/common/Modal";
import ReferralForm from "../components/visits/ReferralForm";
import { useToast } from "../components/common/useToast";
import {
  createReferral,
  listReferrals,
  type ReferralInput,
} from "../services/visitsService";
import type { Referral } from "../types";

export default function ReferralsPage() {
  const toast = useToast();
  const [items, setItems] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listReferrals({ page: 1, pageSize: 30 });
      setItems(res.data);
    } catch {
      toast("โหลดข้อมูลไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(payload: ReferralInput) {
    setSubmitting(true);
    try {
      await createReferral(payload);
      toast("บันทึกการส่งต่อเรียบร้อย", "success");
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

  return (
    <>
      <PageHeader
        title="การส่งต่อโรงพยาบาล"
        description="บันทึกและติดตามการส่งต่อนักเรียนไปโรงพยาบาล"
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={() => setOpen(true)}
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
                <th>ชั้น / เรือนนอน</th>
                <th>อาการ</th>
                <th>นำส่งที่</th>
                <th>การรักษาที่ให้</th>
                <th>ผู้บันทึก</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center py-6">
                    <Loader2 className="inline h-5 w-5 animate-spin text-ksp-blue-500" />
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((r) => (
                  <tr key={r.id}>
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
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="บันทึกการส่งต่อโรงพยาบาล"
        size="lg"
      >
        <ReferralForm
          onSubmit={handleCreate}
          onCancel={() => setOpen(false)}
          submitting={submitting}
        />
      </Modal>
    </>
  );
}
