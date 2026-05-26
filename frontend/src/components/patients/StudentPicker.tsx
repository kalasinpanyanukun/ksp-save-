import { useEffect, useRef, useState } from "react";
import { Search, X, Loader2, UserCheck } from "lucide-react";
import { searchStudents } from "../../services/studentsService";
import type { Student } from "../../types";

interface StudentPickerProps {
  value: Student | null;
  onChange: (student: Student | null) => void;
  disabled?: boolean;
}

export default function StudentPicker({
  value,
  onChange,
  disabled,
}: StudentPickerProps) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const data = await searchStudents(q);
        if (!cancelled) setResults(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, open]);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-ksp-blue-100 bg-ksp-blue-50/40 px-3 py-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-ksp-blue-500 text-white text-xs font-semibold">
            <UserCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-ksp-navy truncate">
              {value.firstName} {value.lastName}
            </div>
            <div className="text-xs text-ksp-gray">
              {value.studentCode} · {value.classRoom ?? "—"} ·{" "}
              {value.dormitory ?? "—"}
            </div>
          </div>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="grid h-8 w-8 place-items-center rounded-md text-ksp-gray hover:bg-rose-50 hover:text-rose-600"
            title="ลบ"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ksp-gray" />
        <input
          className="input pl-9"
          placeholder="ค้นหานักเรียนด้วยรหัส / ชื่อ / นามสกุล"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          disabled={disabled}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-ksp-blue-500" />
        )}
      </div>
      {open && q && (
        <div className="absolute z-30 mt-1 w-full card overflow-hidden">
          <ul className="max-h-72 overflow-y-auto">
            {results.length === 0 && !loading && (
              <li className="px-4 py-4 text-center text-sm text-ksp-gray">
                ไม่พบนักเรียน
              </li>
            )}
            {results.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-ksp-blue-50"
                  onClick={() => {
                    onChange(s);
                    setQ("");
                    setOpen(false);
                  }}
                >
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-ksp-blue-500 text-white text-xs font-semibold">
                    {s.firstName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">
                      {s.firstName} {s.lastName}
                    </div>
                    <div className="text-xs text-ksp-gray">
                      {s.studentCode} · {s.classRoom ?? "—"} ·{" "}
                      {s.dormitory ?? "—"}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
