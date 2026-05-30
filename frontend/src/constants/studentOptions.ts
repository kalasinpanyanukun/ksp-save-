export const DORMITORY_OPTIONS = [
  "แพรวา",
  "ผู้ไท",
  "ฟ้าแดด",
  "ลำปาว",
  "โปงลาง",
  "ภูพาน",
  "สงยาง",
  "ไดโนเสาร์ 1",
  "ไดโนเสาร์ 2",
  "มะหาด",
  "พะยอม",
] as const;

export const CLASS_ROOM_OPTIONS = [
  "ป.1",
  "ป.2",
  "ป.3",
  "ป.4",
  "ป.5",
  "ป.6",
  ...Array.from({ length: 6 }, (_, grade) =>
    Array.from({ length: 5 }, (_, room) => `ม.${grade + 1}/${room + 1}`),
  ).flat(),
] as const;

export const BLOOD_TYPE_OPTIONS = ["A", "B", "AB", "O"] as const;

// คลังยา / เวชภัณฑ์
export const MED_UNIT_OPTIONS = [
  "เม็ด",
  "แคปซูล",
  "ซอง",
  "แผง",
  "ขวด",
  "หลอด",
  "ครีม",
  "ชิ้น",
  "ชุด",
  "กล่อง",
  "ml",
  "cc",
  "mg",
  "หยด",
  "ผืน",
  "อัน",
] as const;

export const MED_SOURCE_OPTIONS = ["เรือนพยาบาล", "ยาประจำตัวนักเรียน"] as const;

export const MED_CATEGORY_OPTIONS: { value: "medicine" | "supply"; label: string }[] = [
  { value: "medicine", label: "ยา" },
  { value: "supply", label: "มิใช่ยา" },
];
