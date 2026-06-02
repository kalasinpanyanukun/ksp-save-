import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Pill,
  Plus,
  Loader2,
  AlertTriangle,
  Edit3,
  ArrowDownUp,
  DownloadCloud,
  Users,
  History,
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Modal from "../components/common/Modal";
import PdfExportButton from "../components/common/PdfExportButton";
import { useAppSelector } from "../store";
import { useToast } from "../components/common/useToast";
import { useTopbarSearch } from "../components/layout/TopbarSearchContext";
import {
  adjustMedication,
  createMedication,
  getMedicationDetail,
  importMedicationsFromStudents,
  listMedications,
  updateMedication,
  type MedicationInput,
} from "../services/visitsService";
import {
  MED_CATEGORY_OPTIONS,
  MED_SOURCE_OPTIONS,
  MED_UNIT_OPTIONS,
} from "../constants/studentOptions";
import type { Medication, MedicationDetail } from "../types";
import { numberInputToNumber, numberInputToString } from "../utils/numberInput";

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export default function MedicationStockPage() {
  const role = useAppSelector((s) => s.auth.user?.role);
  const isAdmin = role === "super_admin" || role === "admin";
  const toast = useToast();
  const [items, setItems] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);
  const [adjusting, setAdjusting] = useState<Medication | null>(null);
  const [importing, setImporting] = useState(false);
  const [detail, setDetail] = useState<MedicationDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 100;
  const topbarSearch = useMemo(
    () => ({
      placeholder: "ค้นหารหัส / ชื่อยา",
      value: q,
      onChange: setQ,
    }),
    [q],
  );
  useTopbarSearch(topbarSearch);

  async function openDetail(id: string) {
    setDetailOpen(true);
    setDetail(null);
    setDetailLoading(true);
    try {
      setDetail(await getMedicationDetail(id));
    } catch {
      toast("โหลดรายละเอียดยาไม่สำเร็จ", "error");
    } finally {
      setDetailLoading(false);
    }
  }

  async function patchMedication(m: Medication, patch: Partial<MedicationInput>) {
    try {
      await updateMedication(m.id, patch);
      await load();
    } catch {
      toast("อัปเดตไม่สำเร็จ", "error");
    }
  }

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

  useEffect(() => {
    setPage(1);
  }, [q, showLowOnly]);

  const lowStockCount = items.filter(
    (m) => m.entryStatus === "entered" && m.stockQty <= m.minStock,
  ).length;
  const filteredItems = useMemo(
    () =>
      items.filter(
        (m) =>
          (!sourceFilter || m.source === sourceFilter) &&
          (!categoryFilter || m.category === categoryFilter) &&
          (!statusFilter || m.entryStatus === statusFilter),
      ),
    [items, sourceFilter, categoryFilter, statusFilter],
  );
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredItems.length / pageSize)),
    [filteredItems.length],
  );
  const visibleItems = useMemo(
    () => filteredItems.slice((page - 1) * pageSize, page * pageSize),
    [filteredItems, page],
  );

  useEffect(() => {
    setPage(1);
  }, [sourceFilter, categoryFilter, statusFilter]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  async function handleImportFromStudents() {
    setImporting(true);
    try {
      const result = await importMedicationsFromStudents();
      toast(
        `ดึงรายการยาจากข้อมูลนักเรียนแล้ว เพิ่ม ${result.created} รายการ ข้าม ${result.skipped} รายการ`,
        "success",
      );
      await load();
    } catch {
      toast("ดึงรายการยาจากข้อมูลนักเรียนไม่สำเร็จ", "error");
    } finally {
      setImporting(false);
    }
  }

  async function handleStatusChange(
    medication: Medication,
    entryStatus: Medication["entryStatus"],
  ) {
    try {
      await updateMedication(medication.id, { entryStatus });
      toast("อัปเดตหมายเหตุเรียบร้อย", "success");
      await load();
    } catch {
      toast("อัปเดตหมายเหตุไม่สำเร็จ", "error");
    }
  }

  return (
    <>
      <PageHeader
        title="คลังยา / เวชภัณฑ์"
        description={`ทั้งหมด ${items.length} รายการ · stock ต่ำ ${lowStockCount} รายการ`}
        actions={
          <>
            <PdfExportButton
              getReport={() => ({
                title: "รายงานคลังยา / เวชภัณฑ์",
                subtitle: `ทั้งหมด ${items.length} รายการ`,
                orientation: "l",
                fontSize: 12,
                columns: [
                  { header: "รหัส", weight: 1.2 },
                  { header: "ชื่อยา", weight: 2.2 },
                  { header: "ที่มาของยา", weight: 1.4 },
                  { header: "ประเภท", weight: 0.9 },
                  { header: "หน่วย", weight: 0.8 },
                  { header: "คงเหลือ", weight: 0.8 },
                  { header: "ขั้นต่ำ", weight: 0.8 },
                  { header: "สถานะ", weight: 1.2 },
                ],
                rows: items.map((m) => [
                  m.drugCode,
                  m.drugName,
                  m.source,
                  m.category === "supply" ? "มิใช่ยา" : "ยา",
                  m.unit ?? "-",
                  m.entryStatus === "entered" ? m.stockQty : "-",
                  m.entryStatus === "entered" ? m.minStock : "-",
                  m.entryStatus === "entered" ? "ลงข้อมูลแล้ว" : "ยังไม่ได้ลงข้อมูล",
                ]),
              })}
            />
            {isAdmin && (
              <>
              <button
                type="button"
                className="btn-outline"
                onClick={handleImportFromStudents}
                disabled={importing}
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <DownloadCloud className="h-4 w-4" />
                )}
                ดึงยาจากข้อมูลนักเรียน
              </button>
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
              </>
            )}
          </>
        }
      />

      <div className="card-pad mb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[auto_auto_auto_1fr] lg:items-center">
          <select className="input lg:w-auto" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="">ทุกที่มา</option>
            {MED_SOURCE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select className="input lg:w-auto" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">ทุกประเภท</option>
            {MED_CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <select className="input lg:w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">ทุกสถานะ</option>
            <option value="entered">ลงข้อมูลแล้ว</option>
            <option value="not_entered">ยังไม่ได้ลงข้อมูล</option>
          </select>
          <label className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-ksp-navy lg:border-0 lg:bg-transparent lg:px-0">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-ksp-blue-200"
              checked={showLowOnly}
              onChange={(e) => setShowLowOnly(e.target.checked)}
            />
            stock ต่ำ
          </label>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base [&_td]:border [&_td]:border-slate-100 [&_th]:border [&_th]:border-slate-200">
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>รหัส</th>
                <th>ชื่อยา</th>
                <th>ที่มาของยา</th>
                <th>ประเภทเวชภัณฑ์</th>
                <th>หน่วย</th>
                <th>คงเหลือ</th>
                <th>ขั้นต่ำ</th>
                <th>สถานะ</th>
                <th>หมายเหตุ</th>
                <th className="text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={11} className="text-center py-6">
                    <Loader2 className="inline h-5 w-5 animate-spin text-ksp-blue-500" />
                  </td>
                </tr>
              )}
              {!loading &&
                visibleItems.map((m, index) => {
                  const isEntered = m.entryStatus === "entered";
                  const isLow = isEntered && m.stockQty <= m.minStock;
                  return (
                    <tr
                      key={m.id}
                      onClick={() => openDetail(m.id)}
                      className="cursor-pointer transition-colors hover:bg-ksp-blue-50/40"
                    >
                      <td className="font-semibold text-ksp-gray">
                        {(page - 1) * pageSize + index + 1}
                      </td>
                      <td className="font-mono text-xs">{m.drugCode}</td>
                      <td className="font-medium text-ksp-blue-700">{m.drugName}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {isAdmin ? (
                          <select
                            className={`rounded-lg border px-2 py-1.5 text-xs font-semibold ${
                              m.source === "ยาประจำตัวนักเรียน"
                                ? "border-ksp-blue-200 bg-ksp-blue-50 text-ksp-blue-700"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                            }`}
                            value={m.source}
                            onChange={(e) => patchMedication(m, { source: e.target.value })}
                          >
                            {MED_SOURCE_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={m.source === "ยาประจำตัวนักเรียน" ? "text-ksp-blue-700" : "text-emerald-700"}>
                            {m.source}
                          </span>
                        )}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {isAdmin ? (
                          <select
                            className={`rounded-lg border px-2 py-1.5 text-xs font-semibold ${
                              m.category === "supply"
                                ? "border-violet-200 bg-violet-50 text-violet-700"
                                : "border-ksp-blue-100 bg-ksp-blue-50 text-ksp-blue-700"
                            }`}
                            value={m.category}
                            onChange={(e) =>
                              patchMedication(m, { category: e.target.value as "medicine" | "supply" })
                            }
                          >
                            {MED_CATEGORY_OPTIONS.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={m.category === "supply" ? "chip-slate" : "chip-blue"}>
                            {m.category === "supply" ? "มิใช่ยา" : "ยา"}
                          </span>
                        )}
                      </td>
                      <td>{m.unit ?? "-"}</td>
                      <td className="font-semibold">
                        {isEntered ? m.stockQty : <span className="text-ksp-gray">-</span>}
                      </td>
                      <td>{isEntered ? m.minStock : <span className="text-ksp-gray">-</span>}</td>
                      <td>
                        {!isEntered ? (
                          <span className="chip-amber">รอลงข้อมูล</span>
                        ) : isLow ? (
                          <span className="chip-rose">
                            <AlertTriangle className="h-3 w-3" /> ต่ำกว่าขั้นต่ำ
                          </span>
                        ) : (
                          <span className="chip-emerald">ปกติ</span>
                        )}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {isAdmin ? (
                          <select
                            className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                              isEntered
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-rose-200 bg-rose-50 text-rose-700"
                            }`}
                            value={m.entryStatus}
                            onChange={(e) =>
                              handleStatusChange(
                                m,
                                e.target.value as Medication["entryStatus"],
                              )
                            }
                          >
                            <option value="entered">ลงข้อมูลแล้ว</option>
                            <option value="not_entered">ยังไม่ได้ลงข้อมูล</option>
                          </select>
                        ) : isEntered ? (
                          <span className="chip-emerald">ลงข้อมูลแล้ว</span>
                        ) : (
                          <span className="chip-rose">ยังไม่ได้ลงข้อมูล</span>
                        )}
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
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
        {!loading && filteredItems.length === 0 && (
          <div className="p-6">
            <EmptyState
              icon={<Pill className="h-7 w-7" />}
              title="ไม่พบรายการ"
              description="ลองปรับตัวกรอง หรือกดปุ่ม 'เพิ่มยา' เพื่อเริ่มเพิ่มคลังยา"
            />
          </div>
        )}
        {!loading && filteredItems.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-ksp-blue-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="text-ksp-gray">
              หน้า {page} / {totalPages} · แสดง {visibleItems.length.toLocaleString("th-TH")} จาก{" "}
              {filteredItems.length.toLocaleString("th-TH")} รายการ
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

      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="รายละเอียดยา / เวชภัณฑ์"
        size="lg"
      >
        {detailLoading || !detail ? (
          <div className="grid min-h-40 place-items-center">
            <Loader2 className="h-7 w-7 animate-spin text-ksp-blue-600" />
          </div>
        ) : (
          <MedicationDetailView detail={detail} />
        )}
      </Modal>
    </>
  );
}

function MedicationDetailView({ detail }: { detail: MedicationDetail }) {
  const { medication: m, movements, students } = detail;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-ksp-blue-50 to-sky-50 px-4 py-3">
        <h2 className="text-xl font-bold text-ksp-navy">{m.drugName}</h2>
        <p className="text-sm text-ksp-blue-700">
          {m.drugCode} · {m.source} · {m.category === "supply" ? "มิใช่ยา" : "ยา"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "คงเหลือ", value: `${m.stockQty} ${m.unit ?? ""}` },
          { label: "ขั้นต่ำ", value: `${m.minStock}` },
          { label: "หน่วย", value: m.unit ?? "-" },
          { label: "สถานะ", value: m.entryStatus === "entered" ? "ลงข้อมูลแล้ว" : "ยังไม่ได้ลงข้อมูล" },
        ].map((it) => (
          <div key={it.label} className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
            <p className="text-[11px] font-semibold text-ksp-gray">{it.label}</p>
            <p className="mt-0.5 text-sm font-bold text-ksp-navy">{it.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-ksp-navy">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
            <History className="h-4 w-4" />
          </span>
          ประวัติรับเข้า / จ่ายออก
        </h3>
        {movements.length === 0 ? (
          <p className="text-sm text-ksp-gray">ยังไม่มีประวัติการเคลื่อนไหว</p>
        ) : (
          <ul className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
            {movements.map((mv) => (
              <li key={mv.id} className="flex flex-col gap-1 rounded-lg border border-slate-100 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className={`font-bold ${mv.delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {mv.delta >= 0 ? `+${mv.delta}` : mv.delta}
                  </span>
                  {mv.reason && <span className="ml-2 text-ksp-gray">{mv.reason}</span>}
                </div>
                <div className="text-left text-xs text-ksp-gray sm:text-right">
                  คงเหลือ {mv.balanceAfter} · {formatDateTime(mv.createdAt)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-ksp-navy">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-ksp-blue-50 text-ksp-blue-700">
            <Users className="h-4 w-4" />
          </span>
          นักเรียนที่ใช้ยานี้ ({students.length} คน)
        </h3>
        {students.length === 0 ? (
          <p className="text-sm text-ksp-gray">ไม่พบนักเรียนที่ใช้ยานี้</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {students.map((s) => (
              <Link
                key={s.id}
                to={`/patients/${s.id}`}
                className="rounded-lg border border-ksp-blue-100 bg-ksp-blue-50/50 px-3 py-1.5 text-sm font-medium text-ksp-blue-700 hover:bg-ksp-blue-50"
              >
                {s.name}
                <span className="ml-1 text-xs text-ksp-gray">
                  {[s.classRoom, s.dormitory].filter(Boolean).join(" · ")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
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
  type MedicationFormState = Omit<MedicationInput, "stockQty" | "minStock"> & {
    stockQty: string;
    minStock: string;
  };
  const [form, setForm] = useState<MedicationFormState>({
    drugCode: initial?.drugCode ?? "",
    drugName: initial?.drugName ?? "",
    drugType: initial?.drugType ?? "",
    source: initial?.source ?? "เรือนพยาบาล",
    category: initial?.category ?? "medicine",
    unit: initial?.unit ?? "",
    stockQty: initial ? numberInputToString(initial.stockQty) : "",
    minStock: initial ? numberInputToString(initial.minStock) : "",
    entryStatus: initial?.entryStatus ?? "entered",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handle(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        stockQty: numberInputToNumber(form.stockQty),
        minStock: numberInputToNumber(form.minStock),
      });
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
          <label className="label">ที่มาของยา</label>
          <select
            className="input"
            value={form.source ?? "เรือนพยาบาล"}
            onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
          >
            {MED_SOURCE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">ประเภทเวชภัณฑ์</label>
          <select
            className="input"
            value={form.category ?? "medicine"}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as "medicine" | "supply" }))}
          >
            {MED_CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">หน่วย</label>
          <select
            className="input"
            value={form.unit ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value || null }))}
          >
            <option value="">ไม่ระบุ</option>
            {MED_UNIT_OPTIONS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
            {form.unit && !MED_UNIT_OPTIONS.includes(form.unit as never) && (
              <option value={form.unit}>{form.unit}</option>
            )}
          </select>
        </div>
        <div>
          <label className="label">คงเหลือ</label>
          <input
            type="number"
            min={0}
            className="input"
            value={form.stockQty}
            onChange={(e) =>
              setForm((f) => ({ ...f, stockQty: e.target.value }))
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
              setForm((f) => ({ ...f, minStock: e.target.value }))
            }
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">หมายเหตุ</label>
          <select
            className="input"
            value={form.entryStatus ?? "entered"}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                entryStatus: e.target.value as Medication["entryStatus"],
              }))
            }
          >
            <option value="entered">ลงข้อมูลแล้ว</option>
            <option value="not_entered">ยังไม่ได้ลงข้อมูล</option>
          </select>
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2 pt-2 max-sm:[&_button]:w-full">
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
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const qtyNumber = numberInputToNumber(qty);

  async function handle(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(mode === "add" ? qtyNumber : -qtyNumber, reason || undefined);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handle} className="space-y-4">
      <div className="rounded-xl bg-ksp-blue-50 px-3 py-2 text-sm">
        คงเหลือปัจจุบัน: <strong>{current}</strong> {unit}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
          onChange={(e) => setQty(e.target.value)}
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
      <div className="flex flex-wrap justify-end gap-2 pt-2 max-sm:[&_button]:w-full">
        <button type="button" className="btn-outline" onClick={onCancel}>
          ยกเลิก
        </button>
        <button type="submit" className="btn-primary" disabled={submitting || qtyNumber <= 0}>
          {submitting ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </form>
  );
}
