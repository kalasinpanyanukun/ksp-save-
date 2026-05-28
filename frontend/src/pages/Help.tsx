import { ArrowUpRight, BedDouble, FileBarChart2, Search, Send, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";

const steps = [
  {
    title: "ค้นหานักเรียน",
    detail: "ใช้ช่องค้นหาด้านบน หรือเปิดเมนูนักเรียน / ผู้ป่วย เพื่อดูประวัติสุขภาพ",
    Icon: Search,
  },
  {
    title: "บันทึก OPD",
    detail: "ใช้เมื่อมีการเข้ามารับยา รักษาเบื้องต้น หรือบันทึกอาการประจำวัน",
    Icon: Stethoscope,
  },
  {
    title: "นอนพักรักษา",
    detail: "รับ admit เมื่อนักเรียนต้องพักที่เรือนพยาบาล และจำหน่ายเมื่อกลับ",
    Icon: BedDouble,
  },
  {
    title: "ส่งต่อโรงพยาบาล",
    detail: "บันทึกข้อมูลการส่งต่อเมื่อจำเป็นต้องไปรับบริการที่โรงพยาบาล",
    Icon: Send,
  },
  {
    title: "รายงานและสถิติ",
    detail: "ดูสรุปประจำวัน ประจำเดือน และส่งออกรายงาน PDF",
    Icon: FileBarChart2,
  },
];

export default function HelpPage() {
  return (
    <>
      <PageHeader
        title="คู่มือใช้งานเบื้องต้น"
        description="แนวทางการทำงานหลักของระบบ KSP SAVE+"
      />

      <section className="grid gap-4 lg:grid-cols-5">
        {steps.map(({ title, detail, Icon }, index) => (
          <article
            key={title}
            className="rounded-lg border border-ksp-blue-50 bg-white p-5 shadow-card"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-ksp-blue-600 text-sm font-bold text-white">
                {index + 1}
              </span>
              <Icon className="h-5 w-5 text-ksp-blue-600" />
            </div>
            <h2 className="font-semibold text-ksp-navy">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-ksp-gray">{detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-lg border border-ksp-blue-50 bg-white p-5 shadow-card">
        <h2 className="text-lg font-semibold text-ksp-navy">เมนูที่ใช้บ่อย</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Link to="/patients" className="btn-outline justify-between">
            นักเรียน / ผู้ป่วย <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link to="/opd" className="btn-outline justify-between">
            OPD - บันทึกการรักษา <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link to="/reports" className="btn-outline justify-between">
            รายงาน & สถิติ <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
