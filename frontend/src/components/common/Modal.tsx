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
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
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
      className="fixed inset-0 z-50 grid items-end overflow-y-auto bg-ksp-navy/40 px-0 py-0 backdrop-blur-sm sm:place-items-center sm:px-4 sm:py-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={clsx(
          "card flex max-h-[92svh] w-full flex-col overflow-hidden rounded-b-none sm:max-h-[calc(100vh-3rem)] sm:rounded-b-2xl",
          sizes[size],
        )}
      >
        {title && (
          <div className="flex items-center justify-between gap-3 border-b border-ksp-blue-50 px-4 py-3.5 sm:px-5">
            <h2 className="min-w-0 break-words font-semibold text-ksp-navy">{title}</h2>
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
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-ksp-blue-50 bg-ksp-bg/60 px-4 py-3 sm:px-5 max-sm:[&_button]:w-full">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
