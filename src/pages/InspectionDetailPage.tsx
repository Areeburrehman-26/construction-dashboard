import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { ArrowLeft, Printer } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { StatusBadge } from "../components/StatusBadge";
import { modeLabels } from "../utils/jobs";

export function InspectionDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const job = useQuery(
    api.jobs.getJobById,
    id ? { jobId: id as Id<"inferences"> } : "skip",
  );

  const structuralStatus = useMemo(() => {
    if (!job?.results?.structural_status) return "No structural finding yet";
    return job.results.structural_status;
  }, [job]);

  if (!id) {
    return (
      <p className="rounded-xl bg-white p-6 text-sm text-slate-600 shadow-sm">
        Missing inspection id.
      </p>
    );
  }

  if (job === undefined) {
    return (
      <p className="rounded-xl bg-white p-6 text-sm text-slate-600 shadow-sm">
        Loading inspection details...
      </p>
    );
  }

  if (!job) {
    return (
      <p className="rounded-xl bg-white p-6 text-sm text-slate-600 shadow-sm">
        Inspection record not found.
      </p>
    );
  }

  return (
    <div className="space-y-5 print:space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <button
          type="button"
          onClick={() => navigate("/history")}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="size-4" />
          Back to History
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
        >
          <Printer className="size-4" />
          Print Report
        </button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm print:shadow-none print:border-slate-300">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold">Inspection Report</h2>
            <p className="text-sm text-slate-600">Report ID: {job._id}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {modeLabels[job.mode]}
            </span>
            <StatusBadge status={job.status} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Site Image</h3>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              {job.originalImageUrl ? (
                <img src={job.originalImageUrl} alt="Original site" className="h-64 w-full object-cover" />
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                  Image unavailable
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              Safety Markup
            </h3>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              {job.resultImageUrl ? (
                <img src={job.resultImageUrl} alt="Analyzed site" className="h-64 w-full object-cover" />
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                  Result image not available
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Structural</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{structuralStatus}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Workers Seen</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{job.results?.worker_safety?.person ?? 0}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hardhats</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{job.results?.worker_safety?.hardhat ?? 0}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Safety Vests</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{job.results?.worker_safety?.vest ?? 0}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
          <p>
            <span className="font-semibold">Date:</span> {new Date(job._creationTime).toLocaleString()}
          </p>
          <p>
            <span className="font-semibold">Feedback:</span>{" "}
            {job.feedbackStatus ? `Marked ${job.feedbackStatus}` : "No feedback yet"}
          </p>
          <p>
            <span className="font-semibold">Inspector:</span> Site Safety System
          </p>
          <p>
            <span className="font-semibold">Signature:</span> ______________________
          </p>
        </div>
      </section>
    </div>
  );
}
