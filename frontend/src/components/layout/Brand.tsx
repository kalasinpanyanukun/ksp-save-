import clsx from "clsx";

interface BrandProps {
  variant?: "color" | "white";
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  withTagline?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: "h-8 w-8", title: "text-base", subtitle: "text-[10px]" },
  md: { icon: "h-10 w-10", title: "text-lg", subtitle: "text-xs" },
  lg: { icon: "h-16 w-16", title: "text-2xl", subtitle: "text-sm" },
} as const;

export default function Brand({
  variant = "color",
  size = "md",
  withText = true,
  withTagline = false,
  className,
}: BrandProps) {
  const s = sizes[size];
  const src = variant === "white" ? "/logo-white.svg" : "/logo.svg";
  const titleColor = variant === "white" ? "text-white" : "text-ksp-navy";
  const subColor =
    variant === "white" ? "text-white/80" : "text-ksp-blue-500";

  return (
    <div className={clsx("flex items-center gap-2.5", className)}>
      <img src={src} alt="KSP SAVE+" className={clsx(s.icon, "shrink-0")} />
      {withText && (
        <div className="flex flex-col leading-tight">
          <span
            className={clsx("font-bold tracking-wide", s.title, titleColor)}
          >
            KSP <span className={subColor}>SAVE+</span>
          </span>
          {withTagline && (
            <span className={clsx(s.subtitle, subColor, "font-medium")}>
              ระบบบริหารจัดการเรือนพยาบาล
            </span>
          )}
        </div>
      )}
    </div>
  );
}
