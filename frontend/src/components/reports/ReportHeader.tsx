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
    <div className="mb-4 flex flex-col gap-3 border-b-2 border-ksp-blue-500 pb-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="grid h-16 w-28 place-items-center rounded-lg bg-ksp-navy px-2">
        <img
          src="/logo.png"
          alt="KSP SAVE+"
          className="max-h-12 w-full object-contain"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-lg font-bold text-ksp-navy sm:text-xl">
          KSP SAVE+ <span className="text-ksp-blue-500">·</span> โรงเรียนกาฬสินธุ์ปัญญานุกูล
        </div>
        <div className="text-base font-semibold text-ksp-navy mt-0.5">
          {title}
        </div>
        {subtitle && (
          <div className="text-sm text-ksp-gray mt-0.5">{subtitle}</div>
        )}
      </div>
      <div className="text-left text-xs text-ksp-gray sm:text-right">
        {dateRangeText && (
          <div className="font-medium text-ksp-navy">{dateRangeText}</div>
        )}
        <div className="mt-0.5">สร้างเมื่อ: {generatedAt}</div>
      </div>
    </div>
  );
}
