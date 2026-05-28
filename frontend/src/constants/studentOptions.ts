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
