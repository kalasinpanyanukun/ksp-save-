import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/lib/password.js";

const prisma = new PrismaClient();

async function main() {
  console.log("[seed] เริ่ม seed ข้อมูลตั้งต้น...");

  const adminUsername = "admin";
  const adminPassword = "ChangeMe123!";

  const existing = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (!existing) {
    const passwordHash = await hashPassword(adminPassword);
    await prisma.user.create({
      data: {
        username: adminUsername,
        passwordHash,
        fullName: "ผู้ดูแลระบบ",
        role: UserRole.admin,
      },
    });
    console.log(`[seed] สร้างผู้ใช้ admin: ${adminUsername} / ${adminPassword}`);
  } else {
    console.log("[seed] มีผู้ใช้ admin อยู่แล้ว — ข้าม");
  }

  const sampleMedications = [
    { drugCode: "PARA500", drugName: "Paracetamol 500 mg", drugType: "แก้ปวด/ลดไข้", unit: "เม็ด", stockQty: 200, minStock: 50 },
    { drugCode: "CHLO4", drugName: "Chlorpheniramine 4 mg", drugType: "แก้แพ้", unit: "เม็ด", stockQty: 100, minStock: 30 },
    { drugCode: "ORS", drugName: "ORS ผงเกลือแร่", drugType: "เกลือแร่", unit: "ซอง", stockQty: 80, minStock: 20 },
    { drugCode: "ALCH70", drugName: "70% Alcohol", drugType: "ฆ่าเชื้อ", unit: "ขวด", stockQty: 30, minStock: 10 },
    { drugCode: "GAUZE", drugName: "ผ้าก๊อซ", drugType: "เวชภัณฑ์", unit: "ห่อ", stockQty: 60, minStock: 20 },
  ];

  for (const med of sampleMedications) {
    await prisma.medication.upsert({
      where: { drugCode: med.drugCode },
      update: {},
      create: med,
    });
  }
  console.log(`[seed] เพิ่มยาตัวอย่าง ${sampleMedications.length} รายการ`);

  console.log("[seed] เสร็จเรียบร้อย");
}

main()
  .catch((err) => {
    console.error("[seed] error", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
