import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  HeartPulse,
  Loader2,
  Pill,
  RefreshCw,
  Search,
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import { useToast } from "../components/common/useToast";
import {
  getSheetData,
  listSheetDormitories,
  type DormitoryOption,
  type SheetDataKind,
  type SheetDataResponse,
} from "../services/sheetDataService";

interface SheetDataPageProps {
  kind: SheetDataKind;
}

const pageCopy = {
  health: {
    title: "ข้อมูลสุขภาพนักเรียน",
    description: "ข้อมูลสุขภาพแยกตามเรือนนอนจากฐานข้อมูล Supabase",
    icon: HeartPulse,
  },
  medication: {
    title: "ข้อมูลยาประจำตัวนักเรียน",
    description: "ข้อมูลรายการยาประจำตัวแยกตามเรือนนอนจากฐานข้อมูล Supabase",
    icon: Pill,
  },
} satisfies Record<SheetDataKind, unknown>;

export default function SheetDataPage({ kind }: SheetDataPageProps) {
  const copy = pageCopy[kind] as {
    title: string;
    description: string;
    icon: typeof HeartPulse;
  };
  const Icon = copy.icon;
  const toast = useToast();
  const [dormitories, setDormitories] = useState<DormitoryOption[]>([]);
  const [activeDormitory, setActiveDormitory] = useState("");
  const [sheet, setSheet] = useState<SheetDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    listSheetDormitories()
      .then((items) => {
        setDormitories(items);
        setActiveDormitory((current) => current || items[0]?.name || "");
      })
      .catch(() => toast("โหลดรายชื่อเรือนนอนไม่สำเร็จ", "error"));
  }, [toast]);

  const load = useCallback(async () => {
    if (!activeDormitory) return;
    setLoading(true);
    try {
      setSheet(await getSheetData(kind, activeDormitory));
    } catch {
      toast("โหลดข้อมูลจาก Supabase ไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  }, [activeDormitory, kind, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const rows = sheet?.rows ?? [];
    const keyword = q.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter((row) =>
      row.cells.some((cell) => cell.toLowerCase().includes(keyword)),
    );
  }, [q, sheet]);

  return (
    <div className="relative left-1/2 w-[calc(100vw-2rem)] -translate-x-1/2 lg:w-[calc(100vw-18rem-2rem)]">
      <PageHeader
        title={copy.title}
        description={copy.description}
        actions={
          <>
            {sheet?.sourceUrl && (
              <a
                href={sheet.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-outline"
              >
                <ExternalLink className="h-4 w-4" /> เปิดชีตต้นทาง
              </a>
            )}
            <button type="button" className="btn-outline" onClick={load}>
              <RefreshCw className="h-4 w-4" /> โหลดใหม่
            </button>
          </>
        }
      />

      <div className="mb-3 flex flex-col gap-3 rounded-md border border-ksp-blue-100 bg-white px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {dormitories.map((item) => (
              <button
                key={item.key}
                type="button"
                className={
                  activeDormitory === item.name
                    ? "rounded-md border border-ksp-blue-600 bg-ksp-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm"
                    : "rounded-md border border-ksp-blue-200 bg-white px-3 py-2 text-xs font-semibold text-ksp-blue-700 hover:bg-ksp-blue-50"
                }
                onClick={() => setActiveDormitory(item.name)}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ksp-gray" />
            <input
              className="input pl-9"
              placeholder="ค้นหาในตาราง"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
      </div>

      <section className="overflow-hidden rounded-md border border-slate-300 bg-white">
        <div className="flex items-center justify-between border-b border-slate-300 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-ksp-blue-50 text-ksp-blue-700">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-ksp-navy">
                เรือนนอน{sheet?.dormitory ?? activeDormitory}
              </h2>
              <p className="text-xs text-ksp-gray">
                {filteredRows.length.toLocaleString("th-TH")} รายการ
              </p>
            </div>
          </div>
          {loading && <Loader2 className="h-5 w-5 animate-spin text-ksp-blue-500" />}
        </div>

        {!loading && filteredRows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="ยังไม่มีข้อมูลใน Supabase"
              description="ยังไม่พบข้อมูลของเรือนนอนนี้ในฐานข้อมูล"
            />
          </div>
        ) : (
          <div className="max-h-[calc(100vh-17rem)] overflow-auto">
            <table className="min-w-max border-separate border-spacing-0 text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-100 text-ksp-navy">
                <tr>
                  {sheet?.headers.map((header, index) => (
                    <th
                      key={`${header}-${index}`}
                      className="border-b border-r border-slate-300 px-3 py-2.5 font-semibold last:border-r-0"
                      style={{ minWidth: columnWidth(header, index) }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.rowNumber} className="odd:bg-white even:bg-slate-50/70 hover:bg-ksp-blue-50/50">
                    {sheet?.headers.map((header, index) => (
                      <td
                        key={`${row.rowNumber}-${header}-${index}`}
                        className="max-w-[22rem] overflow-hidden text-ellipsis whitespace-nowrap border-b border-r border-slate-200 px-3 py-2.5 align-middle text-ksp-navy/85 last:border-r-0"
                        title={row.cells[index] ?? ""}
                      >
                        <CellValue header={header} value={row.cells[index] ?? ""} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function columnWidth(header: string, index: number) {
  if (index <= 1) return "10rem";
  if (header.includes("ชื่อ")) return "15rem";
  if (header.includes("ที่อยู่") || header.includes("หมายเหตุ")) return "22rem";
  if (header.includes("โรค") || header.includes("ยา") || header.includes("แพ้")) {
    return "16rem";
  }
  if (header.includes("กด ✓")) return "8rem";
  return "11rem";
}

function isCheckboxColumn(header: string) {
  return header.includes("กด ✓") || header.includes("ถ้ามีกด ✓");
}

function CellValue({ header, value }: { header: string; value: string }) {
  if (isCheckboxColumn(header)) {
    const checked = value.toUpperCase() === "TRUE" || value === "จริง" || value === "✓";
    return (
      <span
        aria-label={checked ? "เลือกแล้ว" : "ยังไม่เลือก"}
        className={`inline-grid h-5 w-5 place-items-center rounded border text-[11px] font-bold ${
          checked
            ? "border-ksp-blue-600 bg-ksp-blue-600 text-white"
            : "border-slate-300 bg-white text-transparent"
        }`}
      >
        ✓
      </span>
    );
  }

  if (!value) return <span className="text-ksp-gray">-</span>;
  return <span>{value}</span>;
}
