import type { Id } from "../../convex/_generated/dataModel";
import { AlertTriangle, CheckCircle2, Construction, HardHat, Shield } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { formatDateTime, modeLabels, type DatasetCategory, type InferenceMode } from "../utils/jobs";

export type InspectionCardData = {
  _id: Id<"inferences">;
  _creationTime: number;
  mode: InferenceMode;
  status: "pending" | "processing" | "completed";
  originalImageUrl: string | null;
  resultImageUrl: string | null;
  results?:
    | {
        structural_status?: string;
        worker_safety?: {
          hardhat: number;
          vest: number;
          person: number;
        };
      }
    | undefined;
  feedbackStatus?: "positive" | "negative";
};

type InspectionCardProps = {
  job: InspectionCardData;
  onOpenDetails?: (jobId: Id<"inferences">) => void;
  onPositiveFeedback?: (jobId: Id<"inferences">) => void;
  onNegativeFeedback?: (jobId: Id<"inferences">, dataset: DatasetCategory) => void;
  negativeChoice?: DatasetCategory;
  onChangeNegativeChoice?: (jobId: Id<"inferences">, dataset: DatasetCategory) => void;
  feedbackBusy?: boolean;
};

export function InspectionCard({
  job,
  onOpenDetails,
  onPositiveFeedback,
  onNegativeFeedback,
  negativeChoice,
  onChangeNegativeChoice,
  feedbackBusy,
}: InspectionCardProps) {
  const safety = job.results?.worker_safety;
  const structuralText = job.results?.structural_status ?? "No structural review yet";
  const needsAttention = structuralText.toLowerCase().includes("crack");

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {modeLabels[job.mode]}
          </span>
          <StatusBadge status={job.status} />
        </div>
        <p className="text-xs text-slate-500">{formatDateTime(job._creationTime)}</p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <figure className="space-y-2">
          <figcaption className="text-sm font-semibold text-slate-700">Site Image</figcaption>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            {job.originalImageUrl ? (
              <img src={job.originalImageUrl} alt="Site upload" className="h-56 w-full object-cover" />
            ) : (
              <div className="flex h-56 items-center justify-center text-sm text-slate-500">Image unavailable</div>
            )}
          </div>
        </figure>

        <figure className="space-y-2">
          <figcaption className="text-sm font-semibold text-slate-700">Safety Markup</figcaption>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            {job.status === "completed" && job.resultImageUrl ? (
              <img src={job.resultImageUrl} alt="Safety analysis result" className="h-56 w-full object-cover" />
            ) : (
              <div className="flex h-56 flex-col items-center justify-center gap-2 text-sm text-slate-500">
                <div className="h-3 w-40 animate-pulse rounded bg-slate-200" />
                <p>Checking site safety...</p>
              </div>
            )}
          </div>
        </figure>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Construction className="size-4 text-amber-600" />
            Structural Check
          </div>
          <p className={`mt-1 text-sm font-medium ${needsAttention ? "text-red-700" : "text-emerald-700"}`}>
            {structuralText}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <HardHat className="size-4 text-slate-600" />
            Hardhats
          </div>
          <p className="mt-1 text-sm font-bold text-slate-900">{safety?.hardhat ?? 0}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Shield className="size-4 text-slate-600" />
            Safety Vests
          </div>
          <p className="mt-1 text-sm font-bold text-slate-900">{safety?.vest ?? 0}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <CheckCircle2 className="size-4 text-slate-600" />
            Workers Seen
          </div>
          <p className="mt-1 text-sm font-bold text-slate-900">{safety?.person ?? 0}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {onOpenDetails ? (
          <button
            type="button"
            onClick={() => onOpenDetails(job._id)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            View Details
          </button>
        ) : null}

        {job.status === "completed" && !job.feedbackStatus && onPositiveFeedback && onNegativeFeedback ? (
          <>
            <button
              type="button"
              disabled={feedbackBusy}
              onClick={() => onPositiveFeedback(job._id)}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              Accurate
            </button>
            <select
              value={negativeChoice ?? "both"}
              onChange={(event) =>
                onChangeNegativeChoice?.(job._id, event.target.value as DatasetCategory)
              }
              className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
            >
              <option value="ppe">PPE issue</option>
              <option value="crack">Crack issue</option>
              <option value="both">Both issues</option>
            </select>
            <button
              type="button"
              disabled={feedbackBusy}
              onClick={() => onNegativeFeedback(job._id, negativeChoice ?? "both")}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              Not Accurate
            </button>
          </>
        ) : null}

        {job.feedbackStatus ? (
          <div className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
            <AlertTriangle className="size-4" />
            Feedback received
          </div>
        ) : null}
      </div>
    </article>
  );
}
