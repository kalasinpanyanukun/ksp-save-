import { useEffect } from "react";
import clsx from "clsx";
import { CheckCircle2, AlertCircle, Info, XCircle, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { dismissToast } from "../../store/uiSlice";

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertCircle,
} as const;

const STYLES = {
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  error: "bg-rose-50 text-rose-800 border-rose-200",
  info: "bg-ksp-blue-50 text-ksp-blue-700 border-ksp-blue-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
} as const;

export default function Toaster() {
  const toasts = useAppSelector((s) => s.ui.toasts);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => dispatch(dismissToast(t.id)), 4000),
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, dispatch]);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 w-[min(360px,calc(100vw-2rem))]">
      {toasts.map((t) => {
        const type = t.type ?? "info";
        const Icon = ICONS[type];
        return (
          <div
            key={t.id}
            className={clsx(
              "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 shadow-card animate-in fade-in slide-in-from-bottom-2",
              STYLES[type],
            )}
          >
            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-sm flex-1">{t.message}</div>
            <button
              type="button"
              onClick={() => dispatch(dismissToast(t.id))}
              className="text-current/60 hover:text-current"
              aria-label="ปิด"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
