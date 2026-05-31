import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Pill, Plus, Trash2, Users, GraduationCap, HeartPulse } from "lucide-react";
import type { BloodType, Medication, Student, StudentStatus } from "../../types";
import type {
  GuardianInput,
  HealthExtraInput,
  MedicationEntryInput,
  StudentInput,
} from "../../services/studentsService";
import { searchMedications, createMedication } from "../../services/visitsService";
import {
  BLOOD_TYPE_OPTIONS,
  CLASS_ROOM_OPTIONS,
  DORMITORY_OPTIONS,
} from "../../constants/studentOptions";

/** ช่องเลือกยาจากคลังยา (ค้นหาได้) + ปุ่มเพิ่มยาชนิดใหม่ถ้าไม่เจอ */
function MedicationCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Medication[]>([]);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => setQuery(value), [value]);
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      searchMedications(q).then(setResults).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const exact = results.some((r) => r.drugName.toLowerCase() === query.trim().toLowerCase());

  async function addNew() {
    const name = query.trim();
    if (!name) return;
    setCreating(true);
    try {
      const code = `MED-${Date.now().toString(36).toUpperCase()}`.slice(0, 20);
      const med = await createMedication({
        drugCode: code,
        drugName: name,
        source: "ยาประจำตัวนักเรียน",
        category: "medicine",
        unit: null,
        stockQty: 0,
        minStock: 0,
        entryStatus: "not_entered",
      });
      onChange(med.drugName);
      setQuery(med.drugName);
      setOpen(false);
    } catch {
      // ถ้าเพิ่มไม่ได้ ยังคงใช้ชื่อที่พิมพ์ไว้
      onChange(name);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="relative flex-1">
      <input
        className="input"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="ค้นหา/เลือกยาจากคลัง หรือพิมพ์ชื่อใหม่"
      />
      {open && query.trim() && (results.length > 0 || !exact) && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {results.map((r) => (
            <button
              type="button"
              key={r.id}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-ksp-blue-50"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(r.drugName);
                setQuery(r.drugName);
                setOpen(false);
              }}
            >
              {r.drugName}
              {r.unit && <span className="ml-1 text-xs text-ksp-gray">· {r.unit}</span>}
            </button>
          ))}
          {!exact && (
            <button
              type="button"
              disabled={creating}
              className="flex w-full items-center gap-1.5 border-t border-slate-100 px-3 py-2 text-left text-sm font-medium text-ksp-blue-700 hover:bg-ksp-blue-50"
              onMouseDown={(e) => {
                e.preventDefault();
                addNew();
              }}
            >
              <Plus className="h-3.5 w-3.5" /> เพิ่มยาชนิดใหม่ "{query.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface PatientFormProps {
  initial?: Partial<Student>;
  onSubmit: (data: StudentInput) => Promise<void> | void;
  onCancel?: () => void;
  submitting?: boolean;
}

const STUDENT_STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: "resident", label: "ประจำ" },
  { value: "infirmary", label: "ป่วย(นอนเรือนบาล)" },
  { value: "home_leave", label: "ลากลับบ้าน" },
];

const emptyMed: MedicationEntryInput = { name: "", morning: "", noon: "", evening: "", bedtime: "" };

const MEAL_FIELDS: { key: keyof MedicationEntryInput; label: string }[] = [
  { key: "morning", label: "เช้า" },
  { key: "noon", label: "กลางวัน" },
  { key: "evening", label: "เย็น" },
  { key: "bedtime", label: "ก่อนนอน" },
];

function pickHealth(data: Record<string, unknown> | undefined, ...keys: string[]) {
  if (!data) return "";
  for (const k of keys) {
    const v = data[k];
    const t = v === null || v === undefined ? "" : String(v).trim();
    if (t && t !== "-" && t.toUpperCase() !== "FALSE") return t;
  }
  return "";
}

function medsFromInitial(initial?: Partial<Student>): MedicationEntryInput[] {
  const data = initial?.medicationData;
  const list =
    data && typeof data === "object" && Array.isArray((data as Record<string, unknown>)["รายการยา"])
      ? ((data as Record<string, unknown>)["รายการยา"] as Record<string, unknown>[])
      : [];
  const pick = (med: Record<string, unknown>, ...keys: string[]) => {
    for (const k of keys) {
      const v = med[k];
      const t = v === null || v === undefined ? "" : String(v).trim();
      if (t && t !== "-") return t;
    }
    return "";
  };
  return list.map((med) => ({
    name: pick(med, "ชื่อยา", "ข้อมูลยา ชื่อยา"),
    morning: pick(med, "เช้า", "การรับประทาน เช้า"),
    noon: pick(med, "เที่ยง", "การรับประทาน เที่ยง"),
    evening: pick(med, "เย็น", "การรับประทาน เย็น"),
    bedtime: pick(med, "ก่อนนอน", "การรับประทาน ก่อนนอน"),
  }));
}

function guardiansFromInitial(initial?: Partial<Student>): GuardianInput[] {
  if (initial?.guardians && initial.guardians.length > 0) {
    return initial.guardians.map((g) => ({ name: g.name ?? "", phone: g.phone ?? "" }));
  }
  if (initial?.parentName || initial?.parentPhone) {
    return [{ name: initial.parentName ?? "", phone: initial.parentPhone ?? "" }];
  }
  return [];
}

function healthExtraFromInitial(initial?: Partial<Student>): HealthExtraInput {
  const d = initial?.healthData as Record<string, unknown> | undefined;
  return {
    weight: pickHealth(d, "น้ำหนัก (กิโลกรัม)", "น้ำหนัก"),
    height: pickHealth(d, "ส่วนสูง (เซนติเมตร)", "ส่วนสูง"),
    bmi: pickHealth(d, "คะแนน BMI", "คะแนน"),
    bmiResult: pickHealth(d, "แปลผล BMI", "แปลผล"),
    healthRight: pickHealth(d, "สิทธิ"),
    vaccineBasic: pickHealth(d, "ได้รับวัคซีนพื้นฐาน(สมุดชมพู) ครบ/ไม่ครบ", "ได้รับวัคซีนพื้นฐาน(สมุดชมพู)"),
    vaccineFlu: pickHealth(d, "ฉีดวัคซีน ป้องกันไข้หวัดใหญ่ (ปี)", "ป้องกันไข้หวัดใหญ่ (ปี)"),
    vaccineCovid: pickHealth(d, "ฉีดวัคซีน ป้องกันโควิค (ปี)", "ป้องกันโควิค (ปี)"),
    disabilityType: pickHealth(d, "ประเภท ความพิการ", "ประเภท"),
    ageType: pickHealth(d, "เด็กเก่า/ใหม่"),
    idCard: pickHealth(d, "เลขบัตรประชาชน"),
    address: pickHealth(d, "ที่อยู่"),
    physicalResult: pickHealth(d, "ผลตรวจร่างกาย"),
    allergySymptom: pickHealth(d, "อาการแสดงการแพ้"),
    menstruation: pickHealth(d, "การมีประจำเดือน"),
    contraceptionMethod: pickHealth(d, "การคุมกำเนิด"),
    contraceptionLastDate: pickHealth(d, "วันที่คุมกำเนิดล่าสุด"),
    contraceptionNextDate: pickHealth(d, "นัดคุมกำเนิดครั้งถัดไป"),
    injectionSideEffects: pickHealth(d, "อาการผิดปกติหลังฉีดยาคุม"),
    injectionLastDate: pickHealth(d, "วันที่ฉีดยาคุมล่าสุด"),
    injectionPlace: pickHealth(d, "สถานที่ฉีดยาคุม"),
    injectionNextDate: pickHealth(d, "นัดฉีดยาคุมครั้งถัดไป"),
  };
}

const emptyForm: StudentInput = {
  studentCode: "",
  firstName: "",
  lastName: "",
  nickname: "",
  classRoom: "",
  dormitory: "",
  homeroomTeacher: "",
  homeroomTeacherPhone: "",
  bloodType: "unknown",
  congenitalDisease: "",
  drugAllergy: "",
  parentName: "",
  parentPhone: "",
  studentStatus: "resident",
};

function SectionTitle({ Icon, children, action }: { Icon: typeof Users; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="flex items-center gap-2 font-semibold text-ksp-navy">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-ksp-blue-50 text-ksp-blue-600">
          <Icon className="h-4 w-4" />
        </span>
        {children}
      </h3>
      {action}
    </div>
  );
}

export default function PatientForm({ initial, onSubmit, onCancel, submitting }: PatientFormProps) {
  const [form, setForm] = useState<StudentInput>(emptyForm);
  const [meds, setMeds] = useState<MedicationEntryInput[]>([]);
  const [guardians, setGuardians] = useState<GuardianInput[]>([]);
  const [health, setHealth] = useState<HealthExtraInput>({});

  useEffect(() => {
    if (initial) {
      setForm({
        studentCode: initial.studentCode ?? "",
        firstName: initial.firstName ?? "",
        lastName: initial.lastName ?? "",
        nickname: initial.nickname ?? "",
        classRoom: initial.classRoom ?? "",
        dormitory: initial.dormitory ?? "",
        homeroomTeacher: initial.homeroomTeacher ?? "",
        homeroomTeacherPhone: initial.homeroomTeacherPhone ?? "",
        bloodType: initial.bloodType ?? "unknown",
        congenitalDisease: initial.congenitalDisease ?? "",
        drugAllergy: initial.drugAllergy ?? "",
        parentName: initial.parentName ?? "",
        parentPhone: initial.parentPhone ?? "",
        studentStatus: initial.studentStatus ?? "resident",
      });
      setMeds(medsFromInitial(initial));
      setGuardians(guardiansFromInitial(initial));
      setHealth(healthExtraFromInitial(initial));
    } else {
      setForm(emptyForm);
      setMeds([]);
      setGuardians([]);
      setHealth({});
    }
  }, [initial]);

  const autoBmi = useMemo(() => {
    const w = parseFloat(health.weight ?? "");
    const h = parseFloat(health.height ?? "") / 100;
    if (w > 0 && h > 0) return (w / (h * h)).toFixed(2);
    return "";
  }, [health.weight, health.height]);

  function update<K extends keyof StudentInput>(key: K, value: StudentInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function updateMed(index: number, key: keyof MedicationEntryInput, value: string) {
    setMeds((list) => list.map((m, i) => (i === index ? { ...m, [key]: value } : m)));
  }
  function updateGuardian(index: number, key: keyof GuardianInput, value: string) {
    setGuardians((list) => list.map((g, i) => (i === index ? { ...g, [key]: value } : g)));
  }
  function updateHealth(key: keyof HealthExtraInput, value: string) {
    setHealth((h) => ({ ...h, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const cleanedMeds = meds
      .map((m) => ({
        name: m.name.trim(),
        morning: m.morning?.trim() || "",
        noon: m.noon?.trim() || "",
        evening: m.evening?.trim() || "",
        bedtime: m.bedtime?.trim() || "",
      }))
      .filter((m) => m.name);
    const cleanedGuardians = guardians
      .map((g) => ({ name: g.name.trim(), phone: g.phone.trim() }))
      .filter((g) => g.name || g.phone);
    onSubmit({
      ...form,
      guardians: cleanedGuardians,
      healthExtra: { ...health, bmi: health.bmi?.trim() || autoBmi },
      ...(cleanedMeds.length > 0 ? { medications: cleanedMeds } : {}),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. ข้อมูลพื้นฐาน + ผู้ปกครอง */}
      <section>
        <SectionTitle Icon={Users}>ข้อมูลพื้นฐาน</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">รหัสนักเรียน *</label>
            <input className="input" required value={form.studentCode} onChange={(e) => update("studentCode", e.target.value)} placeholder="เช่น 6601001" />
          </div>
          <div>
            <label className="label">สถานะ</label>
            <select className="input" value={form.studentStatus ?? "resident"} onChange={(e) => update("studentStatus", e.target.value as StudentStatus)}>
              {STUDENT_STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">ชื่อ *</label>
            <input className="input" required value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
          </div>
          <div>
            <label className="label">นามสกุล *</label>
            <input className="input" required value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
          </div>
          <div>
            <label className="label">ชื่อเล่น</label>
            <input className="input" value={form.nickname ?? ""} onChange={(e) => update("nickname", e.target.value)} />
          </div>
          <div>
            <label className="label">เลขบัตรประชาชน</label>
            <input className="input" value={health.idCard ?? ""} onChange={(e) => updateHealth("idCard", e.target.value)} />
          </div>
          <div>
            <label className="label">ประเภทความพิการ</label>
            <input className="input" value={health.disabilityType ?? ""} onChange={(e) => updateHealth("disabilityType", e.target.value)} placeholder="เช่น 7 (ออทิสติก) หรือ 2,5" />
          </div>
          <div>
            <label className="label">เด็กเก่า/ใหม่</label>
            <select className="input" value={health.ageType ?? ""} onChange={(e) => updateHealth("ageType", e.target.value)}>
              <option value="">ไม่ระบุ</option>
              <option value="เก่า">เก่า</option>
              <option value="ใหม่">ใหม่</option>
            </select>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-100 bg-ksp-bg/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-ksp-navy">ผู้ปกครอง / ผู้ติดต่อ</p>
            <button type="button" className="btn-outline px-3 py-1.5 text-xs" onClick={() => setGuardians((l) => [...l, { name: "", phone: "" }])}>
              <Plus className="h-3.5 w-3.5" /> เพิ่มผู้ปกครอง
            </button>
          </div>
          {guardians.length === 0 ? (
            <p className="px-1 py-2 text-sm text-ksp-gray">ยังไม่มีผู้ปกครอง — กด "เพิ่มผู้ปกครอง"</p>
          ) : (
            <div className="space-y-2">
              {guardians.map((g, index) => (
                <div key={index} className="flex flex-col gap-2 sm:flex-row">
                  <input className="input flex-1" value={g.name} onChange={(e) => updateGuardian(index, "name", e.target.value)} placeholder={`ชื่อผู้ปกครองคนที่ ${index + 1}`} />
                  <input className="input sm:w-56" value={g.phone} onChange={(e) => updateGuardian(index, "phone", e.target.value)} placeholder="เบอร์โทร" />
                  <button type="button" className="btn-ghost px-2 py-2 text-rose-600 hover:bg-rose-50" onClick={() => setGuardians((l) => l.filter((_, i) => i !== index))} title="ลบ">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3">
            <label className="label">ที่อยู่</label>
            <textarea className="input min-h-[56px]" value={health.address ?? ""} onChange={(e) => updateHealth("address", e.target.value)} placeholder="บ้านเลขที่ หมู่ ตำบล อำเภอ จังหวัด" />
          </div>
        </div>
      </section>

      {/* 2. ข้อมูลชั้นเรียน */}
      <section>
        <SectionTitle Icon={GraduationCap}>ข้อมูลชั้นเรียน</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">ชั้นเรียน</label>
            <select className="input" value={form.classRoom ?? ""} onChange={(e) => update("classRoom", e.target.value)}>
              <option value="">เลือกชั้นเรียน</option>
              {CLASS_ROOM_OPTIONS.map((item) => (<option key={item} value={item}>{item}</option>))}
            </select>
          </div>
          <div>
            <label className="label">เรือนนอน</label>
            <select className="input" value={form.dormitory ?? ""} onChange={(e) => update("dormitory", e.target.value)}>
              <option value="">เลือกเรือนนอน</option>
              {DORMITORY_OPTIONS.map((item) => (<option key={item} value={item}>{item}</option>))}
            </select>
          </div>
          <div>
            <label className="label">ครูประจำชั้น</label>
            <input className="input" value={form.homeroomTeacher ?? ""} onChange={(e) => update("homeroomTeacher", e.target.value)} />
          </div>
          <div>
            <label className="label">เบอร์โทรครูประจำชั้น</label>
            <input className="input" value={form.homeroomTeacherPhone ?? ""} onChange={(e) => update("homeroomTeacherPhone", e.target.value)} placeholder="0XX-XXX-XXXX" />
          </div>
        </div>
      </section>

      {/* 3. ข้อมูลสุขภาพ */}
      <section>
        <SectionTitle Icon={HeartPulse}>ข้อมูลสุขภาพ</SectionTitle>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="label">กรุ๊ปเลือด</label>
            <select className="input" value={form.bloodType ?? "unknown"} onChange={(e) => update("bloodType", e.target.value as BloodType)}>
              <option value="unknown">ไม่ระบุ</option>
              {BLOOD_TYPE_OPTIONS.map((item) => (<option key={item} value={item}>{item}</option>))}
            </select>
          </div>
          <div>
            <label className="label">น้ำหนัก (กก.)</label>
            <input className="input" value={health.weight ?? ""} onChange={(e) => updateHealth("weight", e.target.value)} />
          </div>
          <div>
            <label className="label">ส่วนสูง (ซม.)</label>
            <input className="input" value={health.height ?? ""} onChange={(e) => updateHealth("height", e.target.value)} />
          </div>
          <div>
            <label className="label">BMI {autoBmi && !health.bmi ? `(คำนวณ ${autoBmi})` : ""}</label>
            <input className="input" value={health.bmi ?? ""} onChange={(e) => updateHealth("bmi", e.target.value)} placeholder={autoBmi || "BMI"} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">แปลผล BMI</label>
            <input className="input" value={health.bmiResult ?? ""} onChange={(e) => updateHealth("bmiResult", e.target.value)} placeholder="เช่น ปกติ / น้ำหนักเกิน" />
          </div>
          <div>
            <label className="label">สิทธิการรักษา</label>
            <input className="input" value={health.healthRight ?? ""} onChange={(e) => updateHealth("healthRight", e.target.value)} placeholder="เช่น บัตรทอง / ผู้พิการ" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="label">วัคซีนพื้นฐาน</label>
            <input className="input" value={health.vaccineBasic ?? ""} onChange={(e) => updateHealth("vaccineBasic", e.target.value)} placeholder="ครบ / ไม่ครบ" />
          </div>
          <div>
            <label className="label">วัคซีนไข้หวัดใหญ่ (ปี)</label>
            <input className="input" value={health.vaccineFlu ?? ""} onChange={(e) => updateHealth("vaccineFlu", e.target.value)} />
          </div>
          <div>
            <label className="label">วัคซีนโควิด (ปี)</label>
            <input className="input" value={health.vaccineCovid ?? ""} onChange={(e) => updateHealth("vaccineCovid", e.target.value)} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">โรคประจำตัว</label>
            <textarea className="input min-h-[72px]" value={form.congenitalDisease ?? ""} onChange={(e) => update("congenitalDisease", e.target.value)} placeholder="ระบุโรคประจำตัวถ้ามี" />
          </div>
          <div>
            <label className="label">การแพ้ยา / อาหาร</label>
            <textarea className="input min-h-[72px]" value={form.drugAllergy ?? ""} onChange={(e) => update("drugAllergy", e.target.value)} placeholder="เช่น แพ้ Penicillin" />
          </div>
          <div>
            <label className="label">อาการแสดงการแพ้</label>
            <input className="input" value={health.allergySymptom ?? ""} onChange={(e) => updateHealth("allergySymptom", e.target.value)} placeholder="เช่น ผื่น, จาม" />
          </div>
          <div>
            <label className="label">ผลตรวจร่างกาย</label>
            <input className="input" value={health.physicalResult ?? ""} onChange={(e) => updateHealth("physicalResult", e.target.value)} placeholder="เช่น ปกติ / เหาเล็กน้อย" />
          </div>
        </div>
      </section>

      {/* 3.5 อนามัยเจริญพันธุ์ / การคุมกำเนิด */}
      <section>
        <SectionTitle Icon={HeartPulse}>อนามัยเจริญพันธุ์ / การคุมกำเนิด</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">การมีประจำเดือน</label>
            <input className="input" value={health.menstruation ?? ""} onChange={(e) => updateHealth("menstruation", e.target.value)} placeholder="เช่น เคยมี / ยังไม่มี" />
          </div>
          <div>
            <label className="label">วิธีการคุมกำเนิด</label>
            <input className="input" value={health.contraceptionMethod ?? ""} onChange={(e) => updateHealth("contraceptionMethod", e.target.value)} placeholder="เช่น ฝังยาคุม 3 ปี / ฉีดยาคุม 3 เดือน" />
          </div>
          <div>
            <label className="label">วันที่คุมกำเนิดล่าสุด</label>
            <input className="input" value={health.contraceptionLastDate ?? ""} onChange={(e) => updateHealth("contraceptionLastDate", e.target.value)} />
          </div>
          <div>
            <label className="label">นัดคุมกำเนิดครั้งถัดไป</label>
            <input className="input" value={health.contraceptionNextDate ?? ""} onChange={(e) => updateHealth("contraceptionNextDate", e.target.value)} />
          </div>
          <div>
            <label className="label">วันที่ฉีดยาคุมล่าสุด</label>
            <input className="input" value={health.injectionLastDate ?? ""} onChange={(e) => updateHealth("injectionLastDate", e.target.value)} />
          </div>
          <div>
            <label className="label">สถานที่ฉีดยาคุม</label>
            <input className="input" value={health.injectionPlace ?? ""} onChange={(e) => updateHealth("injectionPlace", e.target.value)} placeholder="เช่น รพ.สต.ดอนยานาง" />
          </div>
          <div>
            <label className="label">นัดฉีดยาคุมครั้งถัดไป</label>
            <input className="input" value={health.injectionNextDate ?? ""} onChange={(e) => updateHealth("injectionNextDate", e.target.value)} />
          </div>
          <div>
            <label className="label">อาการผิดปกติหลังฉีดยาคุม</label>
            <input className="input" value={health.injectionSideEffects ?? ""} onChange={(e) => updateHealth("injectionSideEffects", e.target.value)} placeholder="เช่น ไม่มี" />
          </div>
        </div>
      </section>

      {/* 4. ยาประจำตัว */}
      <section>
        <SectionTitle
          Icon={Pill}
          action={
            <button type="button" className="btn-outline px-3 py-1.5 text-xs" onClick={() => setMeds((list) => [...list, { ...emptyMed }])}>
              <Plus className="h-3.5 w-3.5" /> เพิ่มยา
            </button>
          }
        >
          ยาประจำตัว
        </SectionTitle>
        {meds.length === 0 ? (
          <p className="rounded-lg border border-dashed border-ksp-blue-100 bg-ksp-bg/50 px-3 py-4 text-center text-sm text-ksp-gray">
            ยังไม่มีรายการยา — กด "เพิ่มยา" เพื่อบันทึกชื่อยาและจำนวนตามเวลาที่กิน
          </p>
        ) : (
          <div className="space-y-3">
            {meds.map((med, index) => (
              <div key={index} className="rounded-xl border border-ksp-blue-100 bg-ksp-bg/40 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <MedicationCombobox value={med.name} onChange={(v) => updateMed(index, "name", v)} />
                  <button type="button" className="btn-ghost px-2 py-2 text-rose-600 hover:bg-rose-50" onClick={() => setMeds((list) => list.filter((_, i) => i !== index))} title="ลบยา">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {MEAL_FIELDS.map((field) => (
                    <div key={field.key}>
                      <label className="mb-1 block text-[11px] font-medium text-ksp-gray">{field.label}</label>
                      <input className="input px-2.5 py-2 text-sm" value={(med[field.key] as string) ?? ""} onChange={(e) => updateMed(index, field.key, e.target.value)} placeholder="จำนวน" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
        {onCancel && (
          <button type="button" className="btn-outline" onClick={onCancel}>ยกเลิก</button>
        )}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </form>
  );
}
