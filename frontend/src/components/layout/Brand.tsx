import clsx from "clsx";

interface BrandProps {
  variant?: "color" | "white";
  size?: "sm" | "md" | "lg" | "xl" | "xxl";
  withText?: boolean;
  withTagline?: boolean;
  className?: string;
}

const sizes = {
  sm: "h-9 w-auto max-w-[10rem]",
  md: "h-11 w-auto max-w-[12rem]",
  lg: "h-16 w-auto max-w-[18rem]",
  xl: "h-28 w-auto max-w-[34rem]",
  xxl: "h-[34rem] w-auto max-w-[56rem]",
} as const;

export default function Brand({
  variant = "color",
  size = "md",
  withText = true,
  withTagline = false,
  className,
}: BrandProps) {
  const s = sizes[size];
  void variant;
  void withText;
  void withTagline;

  return (
    <img
      src="/logo.png"
      alt="KSP SAVE+ ระบบบริหารจัดการเรือนพยาบาล"
      className={clsx(s, "block shrink-0 object-contain", className)}
    />
  );
}
