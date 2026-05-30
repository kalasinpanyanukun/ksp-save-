import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { exportTablePdf, type PdfReportOptions } from "../../services/pdfReportService";
import { useToast } from "./useToast";

export default function PdfExportButton({
  getReport,
  label = "ส่งออก PDF",
  className = "btn-outline",
}: {
  getReport: () => PdfReportOptions;
  label?: string;
  className?: string;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function handle() {
    setBusy(true);
    try {
      await exportTablePdf(getReport());
    } catch {
      toast("สร้าง PDF ไม่สำเร็จ", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className={className} onClick={handle} disabled={busy}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
      {label}
    </button>
  );
}
