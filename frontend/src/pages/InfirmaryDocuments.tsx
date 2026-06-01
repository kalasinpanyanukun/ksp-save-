import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  UploadCloud,
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Modal from "../components/common/Modal";
import { useToast } from "../components/common/useToast";
import { useAppSelector } from "../store";
import type { InfirmaryDocument } from "../types";
import {
  createInfirmaryDocument,
  listInfirmaryDocuments,
} from "../services/documentsService";

function formatBytes(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function InfirmaryDocumentsPage() {
  const toast = useToast();
  const role = useAppSelector((s) => s.auth.user?.role);
  const isAdmin = role === "super_admin" || role === "admin";
  const [documents, setDocuments] = useState<InfirmaryDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<InfirmaryDocument | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setDocuments(await listInfirmaryDocuments());
    } catch {
      toast("โหลดเอกสารไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const totalSize = useMemo(
    () => documents.reduce((sum, item) => sum + item.sizeBytes, 0),
    [documents],
  );

  async function handleUpload(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      toast("กรุณาเลือกไฟล์เอกสาร", "error");
      return;
    }
    setSubmitting(true);
    try {
      await createInfirmaryDocument({
        title: title.trim() || file.name,
        description: description.trim(),
        file,
      });
      toast("อัปโหลดเอกสารเรียบร้อย", "success");
      setUploadOpen(false);
      setTitle("");
      setDescription("");
      setFile(null);
      await load();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "อัปโหลดเอกสารไม่สำเร็จ";
      toast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="เอกสารประจำเรือนพยาบาล"
        description={`${documents.length.toLocaleString("th-TH")} เอกสาร · รวม ${formatBytes(totalSize)}`}
        actions={
          isAdmin ? (
            <button type="button" className="btn-primary" onClick={() => setUploadOpen(true)}>
              <Plus className="h-4 w-4" /> เพิ่มเอกสาร
            </button>
          ) : undefined
        }
      />

      <section className="card">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-ksp-gray">
            <Loader2 className="h-5 w-5 animate-spin text-ksp-blue-500" />
            กำลังโหลดเอกสาร…
          </div>
        ) : documents.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<FileText className="h-7 w-7" />}
              title="ยังไม่มีเอกสาร"
              description="กดเพิ่มเอกสารเพื่ออัปโหลดไฟล์ประจำเรือนพยาบาล"
            />
          </div>
        ) : (
          <div className="max-lg:overflow-x-auto rounded-xl sm:rounded-2xl">
            <table className="table-base">
              <thead>
                <tr>
                  <th>ลำดับ</th>
                  <th>ชื่อเอกสาร</th>
                  <th>วันที่อัพโหลด</th>
                  <th>ขนาด</th>
                  <th>คนอัพ</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document, index) => (
                  <tr
                    key={document.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected(document)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelected(document);
                      }
                    }}
                    className="cursor-pointer odd:bg-white even:bg-slate-50/80 hover:bg-ksp-blue-50/50"
                  >
                    <td className="font-semibold text-ksp-gray">{index + 1}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ksp-blue-50 text-ksp-blue-700">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ksp-blue-700">
                            {document.title}
                          </p>
                          <p className="truncate text-xs text-ksp-gray">{document.fileName}</p>
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(document.createdAt)}</td>
                    <td>{formatBytes(document.sizeBytes)}</td>
                    <td>{document.uploadedBy?.fullName ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="รายละเอียดเอกสาร"
        size="lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-ksp-blue-100 bg-ksp-blue-50/60 px-4 py-3">
              <h2 className="text-xl font-bold text-ksp-navy">{selected.title}</h2>
              <p className="mt-1 text-sm text-ksp-blue-700">
                {selected.fileName} · {formatBytes(selected.sizeBytes)} · {formatDate(selected.createdAt)}
              </p>
              {selected.description && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-ksp-navy/80">
                  {selected.description}
                </p>
              )}
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
              {selected.mimeType.startsWith("image/") ? (
                <img
                  src={selected.fileUrl}
                  alt={selected.title}
                  className="max-h-[55vh] w-full object-contain"
                />
              ) : selected.mimeType === "application/pdf" ? (
                <iframe
                  src={selected.fileUrl}
                  title={selected.title}
                  className="h-[55vh] w-full bg-white"
                />
              ) : (
                <div className="grid min-h-48 place-items-center p-6 text-center">
                  <div>
                    <FileText className="mx-auto h-10 w-10 text-ksp-blue-500" />
                    <p className="mt-3 font-semibold text-ksp-navy">{selected.fileName}</p>
                    <p className="mt-1 text-sm text-ksp-gray">{selected.mimeType}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-ksp-blue-50 pt-3 max-sm:[&_a]:w-full max-sm:[&_a]:justify-center">
              <a href={selected.fileUrl} target="_blank" rel="noreferrer" className="btn-outline">
                <ExternalLink className="h-4 w-4" /> อ่านเอกสาร
              </a>
              <a href={selected.fileUrl} download={selected.fileName} className="btn-primary">
                <Download className="h-4 w-4" /> ดาวน์โหลดเอกสาร
              </a>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="เพิ่มเอกสาร"
        size="lg"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="label">ชื่อเอกสาร *</label>
            <input
              className="input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="เช่น แนวทางการดูแลนักเรียน"
              required
            />
          </div>
          <div>
            <label className="label">รายละเอียด</label>
            <textarea
              className="input min-h-24"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="สรุปรายละเอียดเอกสาร"
            />
          </div>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-ksp-blue-200 bg-ksp-blue-50/50 px-4 py-8 text-center hover:bg-ksp-blue-50">
            <UploadCloud className="h-8 w-8 text-ksp-blue-600" />
            <span className="mt-2 font-semibold text-ksp-navy">
              {file ? file.name : "เลือกไฟล์เอกสาร"}
            </span>
            <span className="mt-1 text-xs text-ksp-gray">
              ขนาดไฟล์ไม่เกิน 50 MB
            </span>
            <input
              type="file"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3 max-sm:[&_button]:w-full">
            <button type="button" className="btn-outline" onClick={() => setUploadOpen(false)}>
              ยกเลิก
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "กำลังอัปโหลด..." : "อัปโหลดเอกสาร"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
