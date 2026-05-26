import { useEffect, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../components/common/useToast";
import { api } from "../../services/api";

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  diff: unknown;
  ipAddress: string | null;
  createdAt: string;
  user?: { id: string; username: string; fullName: string } | null;
}

export default function AdminAuditPage() {
  const toast = useToast();
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const { data } = await api.get<{
          data: AuditEntry[];
          total: number;
        }>("/audit-logs", { params: { page, pageSize } });
        if (!cancelled) {
          setItems(data.data);
          setTotal(data.total);
        }
      } catch {
        if (!cancelled) toast("โหลดประวัติไม่สำเร็จ", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [page, toast]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="ประวัติการใช้งานระบบของผู้ใช้แต่ละคน"
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>เวลา</th>
                <th>ผู้ใช้</th>
                <th>การกระทำ</th>
                <th>หมวด</th>
                <th>เป้าหมาย</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center py-6">
                    <Loader2 className="inline h-5 w-5 animate-spin text-ksp-blue-500" />
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((e) => (
                  <tr key={e.id}>
                    <td className="text-xs">
                      {new Date(e.createdAt).toLocaleString("th-TH")}
                    </td>
                    <td>{e.user?.fullName ?? "(ระบบ)"}</td>
                    <td>
                      <span className="chip-blue">{e.action}</span>
                    </td>
                    <td>{e.entity}</td>
                    <td className="font-mono text-xs">{e.entityId ?? "-"}</td>
                    <td className="text-xs text-ksp-gray">{e.ipAddress ?? "-"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!loading && items.length === 0 && (
          <div className="p-6">
            <EmptyState
              icon={<ShieldCheck className="h-7 w-7" />}
              title="ยังไม่มีบันทึก audit"
              description="ระบบจะเริ่มบันทึกหลังจากเริ่มใช้งาน"
            />
          </div>
        )}
        {!loading && items.length > 0 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-ksp-blue-50 text-sm">
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
    </>
  );
}
