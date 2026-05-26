import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="card-pad text-center py-12">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-ksp-blue-50 text-ksp-blue-500">
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <h3 className="text-base font-semibold text-ksp-navy">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-ksp-gray">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
