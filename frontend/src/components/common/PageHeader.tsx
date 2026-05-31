import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-5 flex min-w-0 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="break-words text-[1.45rem] font-bold tracking-tight text-ksp-navy sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 break-words text-sm text-ksp-gray">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end max-sm:[&_a]:w-full max-sm:[&_button]:w-full max-sm:[&_a]:justify-center max-sm:[&_button]:justify-center">
          {actions}
        </div>
      )}
    </div>
  );
}
