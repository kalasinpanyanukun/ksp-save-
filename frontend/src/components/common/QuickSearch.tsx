import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Loader2 } from "lucide-react";
import { searchStudents } from "../../services/studentsService";
import type { Student } from "../../types";

export default function QuickSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const close = useCallback(() => {
    setOpen(false);
    setQ("");
    setResults([]);
    setHighlight(0);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.userAgent.toUpperCase().includes("MAC");
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape") {
        close();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [close]);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!q.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchStudents(q);
        if (!cancelled) {
          setResults(res);
          setHighlight(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, open]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(results.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      const target = results[highlight];
      if (target) {
        navigate(`/patients/${target.id}`);
        close();
      }
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ksp-navy/40 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className="card w-[min(40rem,calc(100vw-2rem))] max-h-[78vh] overflow-hidden">
        <div className="flex min-w-0 items-center gap-2 border-b border-ksp-blue-50 px-4">
          <Search className="h-4 w-4 text-ksp-gray" />
          <input
            ref={inputRef}
            className="min-w-0 flex-1 border-0 bg-transparent py-3.5 text-sm outline-none ring-0 focus:ring-0"
            placeholder="ค้นหานักเรียนด้วยรหัส, ชื่อ, นามสกุล..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-ksp-blue-500" />
          )}
          <button
            type="button"
            onClick={close}
            className="grid h-7 w-7 place-items-center rounded-md text-ksp-gray hover:bg-ksp-blue-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto py-1">
          {results.length === 0 && q && !loading && (
            <li className="px-4 py-6 text-center text-sm text-ksp-gray">
              ไม่พบนักเรียนที่ตรงกับ "{q}"
            </li>
          )}
          {!q && (
            <li className="px-4 py-3 text-xs text-ksp-gray">
              เริ่มพิมพ์เพื่อค้นหา · กด <kbd className="px-1.5 py-0.5 rounded bg-ksp-blue-50 border border-ksp-blue-100 text-[10px]">Esc</kbd> เพื่อปิด
            </li>
          )}
          {results.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onMouseEnter={() => setHighlight(i)}
                onClick={() => {
                  navigate(`/patients/${s.id}`);
                  close();
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm ${
                  i === highlight
                    ? "bg-ksp-blue-50 text-ksp-navy"
                    : "hover:bg-ksp-blue-50/60"
                }`}
              >
                <div className="grid h-9 w-9 place-items-center rounded-full bg-ksp-blue-500 text-white text-xs font-semibold">
                  {s.firstName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {s.firstName} {s.lastName}
                  </div>
                  <div className="text-xs text-ksp-gray">
                    {s.studentCode} · {s.classRoom ?? "—"} · {s.dormitory ?? "—"}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
