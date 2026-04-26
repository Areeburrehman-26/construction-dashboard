import type { JobStatus } from "../utils/jobs";
import { statusLabels } from "../utils/jobs";

const statusClasses: Record<JobStatus, string> = {
  pending: "bg-slate-200 text-slate-700",
  processing: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
};

type StatusBadgeProps = {
  status: JobStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
