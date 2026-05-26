import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import type { Medication, OpdMedicationItem } from "../../types";
import { searchMedications } from "../../services/visitsService";

interface MedicationPickerProps {
  value: OpdMedicationItem[];
  onChange: (value: OpdMedicationItem[]) => void;
}

export default function MedicationPicker({
  value,
  onChange,
}: MedicationPickerProps) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Medication[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const data = await searchMedications(q);
      if (!cancelled) setResults(data);
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, open]);

  function addMedication(med: Medication) {
    if (value.some((v) => v.drugId === med.id)) {
      setQ("");
      setOpen(false);
      return;
    }
    onChange([
      ...value,
      { drugId: med.id, drugName: med.drugName, dose: "", qty: 1 },
    ]);
    setQ("");
    setOpen(false);
  }

  function addCustom() {
    if (!q.trim()) return;
    onChange([...value, { drugName: q.trim(), dose: "", qty: 1 }]);
    setQ("");
    setOpen(false);
  }

  function update(i: number, patch: Partial<OpdMedicationItem>) {
    onChange(value.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-2">
      <div ref={ref} className="relative">
        <input
          className="input"
          placeholder="ค้นหายาในคลัง หรือพิมพ์ชื่อยาแล้วกดปุ่ม +"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {open && (q || results.length > 0) && (
          <div className="absolute z-20 mt-1 w-full card overflow-hidden">
            <ul className="max-h-60 overflow-y-auto">
              {results.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-ksp-blue-50"
                    onClick={() => addMedication(m)}
                  >
                    <div>
                      <div className="font-medium">{m.drugName}</div>
                      <div className="text-xs text-ksp-gray">
                        {m.drugCode} · คงเหลือ {m.stockQty} {m.unit ?? ""}
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-ksp-blue-500" />
                  </button>
                </li>
              ))}
              {q && (
                <li>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm border-t border-ksp-blue-50 hover:bg-ksp-blue-50"
                    onClick={addCustom}
                  >
                    <Plus className="h-4 w-4 text-ksp-blue-500" />
                    เพิ่ม "{q}" เป็นรายการใหม่
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {value.length > 0 && (
        <div className="overflow-x-auto border border-ksp-blue-50 rounded-xl">
          <table className="table-base">
            <thead>
              <tr>
                <th>ชื่อยา</th>
                <th className="w-32">ขนาด/วิธีใช้</th>
                <th className="w-24">จำนวน</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {value.map((m, i) => (
                <tr key={i}>
                  <td>{m.drugName}</td>
                  <td>
                    <input
                      className="input py-1.5"
                      value={m.dose ?? ""}
                      onChange={(e) => update(i, { dose: e.target.value })}
                      placeholder="เช่น 1x3 pc"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      className="input py-1.5"
                      value={m.qty ?? 0}
                      onChange={(e) =>
                        update(i, { qty: Number(e.target.value) })
                      }
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="grid h-8 w-8 place-items-center rounded-md text-ksp-gray hover:bg-rose-50 hover:text-rose-600"
                      title="ลบ"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
