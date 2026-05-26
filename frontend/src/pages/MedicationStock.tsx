import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Pill,
  Plus,
  Loader2,
  AlertTriangle,
  Edit3,
  ArrowDownUp,
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Modal from "../components/common/Modal";
import { useAppSelector } from "../store";
import { useToast } from "../components/common/useToast";
import {
  adjustMedication,
  createMedication,
  listMedications,
  updateMedication,
  type MedicationInput,
} from "../services/visitsService";
import type { Medication } from "../types";

export default function MedicationStockPage() {
  const isAdmin = useAppSelector((s) => s.auth.user?.role) === "admin";
  const toast = useToast();
  const [items, setItems] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);
  const [adjusting, setAdjusting] = useState<Medication | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listMedications({
        q,
        lowStock: showLowOnly ? true : undefined,
      });
      setItems(data);
    } catch {
      toast("โหลดคลังยาไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  }, [q, showLowOnly, toast]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const lowStockCount = items.filter((m) => m.stockQty <= m.minStock).length;

  return (
    <>
      <PageHeader
        title="คลังยา / เวชภัณฑ์"
        description={`ทั้งหมด ${items.length} รายการ · stock ต่ำ ${lowStockCount} รายการ`}
        actions={
          isAdmin && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> เพิ่มยา
            </button>
          )
        }
      />

      <div className="card-pad mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            className="input max-w-[280px]"
            placeholder="ค้นหารหัส / ชื่อยา"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-ksp-navy">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-ksp-blue-200"
              checked={showLowOnly}
              onChange={(e) => setShowLowOnly(e.target.checked)}
            />
            แสดงเฉพาะรายการ stock ต่ำ
          </label>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>รหัส</th>
                <th>ชื่อยา</th>
                <th>ประเภท</th>
                <th>หน่วย</th>
                <th>คงเหลือ</th>
                <th>ขั้นต่ำ</th>
                <th>สถานะ</th>
                <th className="text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center py-6">
                    <Loader2 className="inline h-5 w-5 animate-spin text-ksp-blue-500" />
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((m) => {
                  const isLow = m.stockQty <= m.minStock;
                  return (
                    <tr key={m.id}>
                      <td className="font-mono text-xs">{m.drugCode}</td>
                      <td className="font-medium">{m.drugName}</td>
                      <td>{m.drugType ?? "-"}</td>
                      <td>{m.unit ?? "-"}</td>
                      <td className="font-semibold">{m.stockQty}</td>
                      <td>{m.minStock}</td>
                      <td>
                        {isLow ? (
                          <span className="chip-rose">
                            <AlertTriangle className="h-3 w-3" /> ต่ำกว่าขั้นต่ำ
                          </span>
                        ) : (
                          <span className="chip-emerald">ปกติ</span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            className="btn-ghost px-2 py-1.5"
                            onClick={() => setAdjusting(m)}
                            title="ปรับ stock"
                          >
                            <ArrowDownUp className="h-4 w-4" />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              className="btn-ghost px-2 py-1.5"
                              onClick={() => {
                                setEditing(m);
                                setOpen(true);
                              }}
                              title="แก้ไข"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        {!loading && items.length === 0 && (
          <div className="p-6">
            <EmptyState
              icon={<Pill className="h-7 w-7" />}
              title="ยังไม่มีรายการยา"
              description="กดปุ่ม 'เพิ่มยา' เพื่อเริ่มเพิ่มคลังยา"
            />
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "แก้ไขข้อมูลยา" : "เพิ่มยา"}
        size="md"
      >
        <MedicationForm
          initial={editing}
          onCancel={() => setOpen(false)}
          onSubmit={async (data) => {
            try {
              if (editing) await updateMedication(editing.id, data);
              else await createMedication(data);
              toast(editing ? "อัปเดตเรียบร้อย" : "เพิ่มยาเรียบร้อย", "success");
              setOpen(false);
              await load();
            } catch (err) {
              const m =
                (err as { response?: { data?: { message?: string } } })?.response
                  ?.data?.message ?? "บันทึกไม่สำเร็จ";
              toast(m, "error");
            }
          }}
        />
      </Modal>

      <Modal
        open={Boolean(adjusting)}
        onClose={() => setAdjusting(null)}
        title={`ปรับ stock: ${adjusting?.drugName ?? ""}`}
        size="sm"
      >
        {adjusting && (
          <AdjustForm
            current={adjusting.stockQty}
            unit={adjusting.unit ?? ""}
            onCancel={() => setAdjusting(null)}
            onSubmit={async (delta, reason) => {
              try {
                await adjustMedication(adjusting.id, delta, reason);
                toast("ปรับ stock เรียบร้อย", "success");
                setAdjusting(null);
                await load();
              } catch (err) {
                const m =
                  (err as { response?: { data?: { message?: string } } })
                    ?.response?.data?.message ?? "ปรับไม่สำเร็จ";
                toast(m, "error");
              }
            }}
          />
        )}
      </Modal>
    </>
  );
}

function MedicationForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: Medication | null;
  onSubmit: (data: MedicationInput) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<MedicationInput>({
    drugCode: initial?.drugCode ?? "",
    drugName: initial?.drugName ?? "",
    drugType: initial?.drugType ?? "",
    unit: initial?.unit ?? "",
    stockQty: initial?.stockQty ?? 0,
    minStock: initial?.minStock ?? 0,
  });
  const [submitting, setSubmitting] = useState(false);

  async function handle(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <form onSubmit={handle} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">รหัส *</label>
          <input
            className="input"
            value={form.drugCode}
            onChange={(e) => setForm((f) => ({ ...f, drugCode: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="label">ชื่อยา *</label>
          <input
            className="input"
            value={form.drugName}
            onChange={(e) => setForm((f) => ({ ...f, drugName: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="label">ประเภท</label>
          <input
            className="input"
            value={form.drugType ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, drugType: e.target.value || null }))
            }
            placeholder="เช่น แก้ปวด/ลดไข้"
          />
        </div>
        <div>
          <label className="label">หน่วย</label>
          <input
            className="input"
            value={form.unit ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, unit: e.target.value || null }))
            }
            placeholder="เช่น เม็ด, ขวด, ซอง"
          />
        </div>
        <div>
          <label className="label">คงเหลือ</label>
          <input
            type="number"
            min={0}
            className="input"
            value={form.stockQty}
            onChange={(e) =>
              setForm((f) => ({ ...f, stockQty: Number(e.target.value) }))
            }
          />
        </div>
        <div>
          <label className="label">ขั้นต่ำ (สำหรับแจ้งเตือน)</label>
          <input
            type="number"
            min={0}
            className="input"
            value={form.minStock}
            onChange={(e) =>
              setForm((f) => ({ ...f, minStock: Number(e.target.value) }))
            }
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
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

function AdjustForm({
  current,
  unit,
  onSubmit,
  onCancel,
}: {
  current: number;
  unit: string;
  onSubmit: (delta: number, reason?: string) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [qty, setQty] = useState(0);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handle(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(mode === "add" ? qty : -qty, reason || undefined);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handle} className="space-y-4">
      <div className="rounded-xl bg-ksp-blue-50 px-3 py-2 text-sm">
        คงเหลือปัจจุบัน: <strong>{current}</strong> {unit}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("add")}
          className={`flex-1 btn ${
            mode === "add"
              ? "bg-emerald-500 text-white"
              : "bg-white border border-ksp-blue-100 text-ksp-navy"
          }`}
        >
          + รับยาเข้า
        </button>
        <button
          type="button"
          onClick={() => setMode("remove")}
          className={`flex-1 btn ${
            mode === "remove"
              ? "bg-rose-500 text-white"
              : "bg-white border border-ksp-blue-100 text-ksp-navy"
          }`}
        >
          − จ่ายยา/ลดลง
        </button>
      </div>
      <div>
        <label className="label">จำนวน *</label>
        <input
          type="number"
          min={1}
          className="input"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          required
        />
      </div>
      <div>
        <label className="label">เหตุผล</label>
        <input
          className="input"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="เช่น รับเข้าจากเภสัช, หมดอายุ"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-outline" onClick={onCancel}>
          ยกเลิก
        </button>
        <button type="submit" className="btn-primary" disabled={submitting || qty <= 0}>
          {submitting ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </form>
  );
}
