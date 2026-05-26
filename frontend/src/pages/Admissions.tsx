import { useCallback, useEffect, useState } from "react";
import { Plus, Loader2, BedDouble, LogOut } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Modal from "../components/common/Modal";
import AdmissionForm from "../components/visits/AdmissionForm";
import DischargeForm from "../components/visits/DischargeForm";
import { useToast } from "../components/common/useToast";
import {
  createAdmission,
  dischargeAdmission,
  listActiveAdmissions,
  listAdmissions,
  type AdmissionInput,
} from "../services/visitsService";
import type { Admission, DischargeDestination } from "../types";

export default function AdmissionsPage() {
  const toast = useToast();
  const [active, setActive] = useState<Admission[]>([]);
  const [history, setHistory] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [discharging, setDischarging] = useState<Admission | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, all] = await Promise.all([
        listActiveAdmissions(),
        listAdmissions({ status: "discharged", page: 1, pageSize: 20 }),
      ]);
      setActive(a);
      setHistory(all.data);
    } catch {
      toast("โหลดข้อมูล admission ไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(payload: AdmissionInput) {
    setSubmitting(true);
    try {
      await createAdmission(payload);
      toast("บันทึก admission เรียบร้อย", "success");
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
            onClick={() => setOpen(true)}
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
            <div key={a.id} className="card-pad">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-ksp-navy">
                    {a.student?.firstName} {a.student?.lastName}
                  </div>
                  <div className="text-xs text-ksp-gray">
                    {a.student?.studentCode} · {a.student?.classRoom ?? "—"}
                  </div>
                </div>
                <span className="chip-amber">กำลังพัก</span>
              </div>
              <div className="mt-3 text-sm text-ksp-navy/90">
                {a.chiefComplaint}
              </div>
              <div className="mt-3 text-xs text-ksp-gray">
                Admit:{" "}
                {new Date(a.admitDate).toLocaleDateString("th-TH")} · {a.admitTime}
              </div>
              <button
                type="button"
                className="btn-primary w-full mt-3"
                onClick={() => setDischarging(a)}
              >
                <LogOut className="h-4 w-4" /> จำหน่าย
              </button>
            </div>
          ))}
        </div>
      )}

      <h2 className="font-semibold text-ksp-navy mt-8 mb-3">
        ประวัติ admission (20 รายการล่าสุด)
      </h2>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>นักเรียน</th>
                <th>ชั้น</th>
                <th>Admit</th>
                <th>Discharge</th>
                <th>จุดหมาย</th>
                <th>วันที่นอน</th>
                <th>อาการ</th>
              </tr>
            </thead>
            <tbody>
              {history.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="font-medium">
                      {a.student?.firstName} {a.student?.lastName}
                    </div>
                    <div className="text-xs text-ksp-gray">
                      {a.student?.studentCode}
                    </div>
                  </td>
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
                </tr>
              ))}
              {history.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-ksp-gray text-sm">
                    ยังไม่มีประวัติ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="รับ admit ใหม่"
        size="lg"
      >
        <AdmissionForm
          onSubmit={handleCreate}
          onCancel={() => setOpen(false)}
          submitting={submitting}
        />
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
    </>
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
