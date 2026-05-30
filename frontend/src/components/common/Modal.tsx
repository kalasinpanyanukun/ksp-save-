import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import clsx from "clsx";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: ReactNode;
  footer?: ReactNode;
}

const sizes = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function Modal({
  open,
  onClose,
  title,
  size = "md",
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ksp-navy/40 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={clsx(
          "card flex max-h-[calc(100vh-3rem)] w-full flex-col overflow-hidden",
          sizes[size],
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-ksp-blue-50">
            <h2 className="font-semibold text-ksp-navy">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg text-ksp-gray hover:bg-ksp-blue-50"
              aria-label="ปิด"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 px-5 py-3 border-t border-ksp-blue-50 bg-ksp-bg/60">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
