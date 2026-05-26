import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDialog({
  open,
  title = "ยืนยันการดำเนินการ",
  message,
  confirmLabel = "ตกลง",
  cancelLabel = "ยกเลิก",
  danger,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button type="button" className="btn-outline" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? "btn-danger" : "btn-primary"}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
            danger ? "bg-rose-50 text-rose-600" : "bg-ksp-blue-50 text-ksp-blue-600"
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="text-sm text-ksp-navy/90 leading-relaxed">{message}</p>
      </div>
    </Modal>
  );
}
