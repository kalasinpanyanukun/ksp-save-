interface ReportHeaderProps {
  title: string;
  subtitle?: string;
  dateRangeText?: string;
}

export default function ReportHeader({
  title,
  subtitle,
  dateRangeText,
}: ReportHeaderProps) {
  const generatedAt = new Date().toLocaleString("th-TH");
  return (
    <div className="flex items-center gap-4 pb-4 mb-4 border-b-2 border-ksp-blue-500">
      <img src="/logo.svg" alt="KSP SAVE+" className="h-14 w-14" />
      <div className="flex-1">
        <div className="text-xl font-bold text-ksp-navy">
          KSP SAVE+ <span className="text-ksp-blue-500">·</span> โรงเรียนกาฬสินธุ์ปัญญานุกูล
        </div>
        <div className="text-base font-semibold text-ksp-navy mt-0.5">
          {title}
        </div>
        {subtitle && (
          <div className="text-sm text-ksp-gray mt-0.5">{subtitle}</div>
        )}
      </div>
      <div className="text-right text-xs text-ksp-gray">
        {dateRangeText && (
          <div className="font-medium text-ksp-navy">{dateRangeText}</div>
        )}
        <div className="mt-0.5">สร้างเมื่อ: {generatedAt}</div>
      </div>
    </div>
  );
}
