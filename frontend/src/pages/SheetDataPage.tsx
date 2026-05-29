import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  HeartPulse,
  Loader2,
  Pill,
  RefreshCw,
  Search,
  UploadCloud,
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import { useToast } from "../components/common/useToast";
import { useAppSelector } from "../store";
import {
  getSheetData,
  importStudentsFromSheets,
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
  const role = useAppSelector((s) => s.auth.user?.role);
  const isAdmin = role === "super_admin" || role === "admin";
  const toast = useToast();
  const [dormitories, setDormitories] = useState<DormitoryOption[]>([]);
  const [activeDormitory, setActiveDormitory] = useState("");
  const [sheet, setSheet] = useState<SheetDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
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
      toast("โหลดข้อมูลจาก Google Sheets ไม่สำเร็จ", "error");
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

  async function handleImport() {
    setImporting(true);
    try {
      const result = await importStudentsFromSheets();
      toast(
        `นำเข้าลง Supabase แล้ว: สุขภาพ เพิ่ม ${result.health.created} อัปเดต ${result.health.updated} | ยา เพิ่ม ${result.medication.created} อัปเดต ${result.medication.updated}`,
        "success",
      );
      await load();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "นำเข้าข้อมูลไม่สำเร็จ";
      toast(message, "error");
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
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
            {isAdmin && (
              <button
                type="button"
                className="btn-primary"
                onClick={handleImport}
                disabled={importing}
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="h-4 w-4" />
                )}
                นำเข้าจาก Google Sheets เข้า Supabase
              </button>
            )}
          </>
        }
      />

      <div className="card-pad mb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {dormitories.map((item) => (
              <button
                key={item.key}
                type="button"
                className={
                  activeDormitory === item.name
                    ? "btn-primary px-3 py-2 text-xs"
                    : "btn-outline px-3 py-2 text-xs"
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
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-ksp-blue-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-ksp-blue-50 text-ksp-blue-700">
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
              description={
                isAdmin
                  ? "กดปุ่มนำเข้าจาก Google Sheets เข้า Supabase เพื่อบันทึกเป็นฐานข้อมูลนักเรียน"
                  : "ติดต่อผู้ดูแลระบบให้นำเข้าข้อมูลจาก Google Sheets ก่อน"
              }
            />
          </div>
        ) : (
          <div className="max-h-[62vh] overflow-auto">
            <table className="min-w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 z-10 bg-ksp-blue-50 text-ksp-navy">
                <tr>
                  {sheet?.headers.map((header, index) => (
                    <th
                      key={`${header}-${index}`}
                      className="whitespace-nowrap border-b border-ksp-blue-100 px-3 py-2 font-semibold"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ksp-blue-50">
                {filteredRows.map((row) => (
                  <tr key={row.rowNumber} className="hover:bg-ksp-blue-50/40">
                    {sheet?.headers.map((header, index) => (
                      <td
                        key={`${row.rowNumber}-${header}-${index}`}
                        className="max-w-[18rem] whitespace-nowrap px-3 py-2 text-ksp-navy/85"
                        title={row.cells[index] ?? ""}
                      >
                        {row.cells[index] || <span className="text-ksp-gray">-</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
