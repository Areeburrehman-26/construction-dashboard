import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { Search } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { InferenceMode } from "../utils/jobs";
import { modeLabels } from "../utils/jobs";
import { StatusBadge } from "../components/StatusBadge";

type FilterStatus = "all" | "pending" | "processing" | "completed";
type FilterMode = "all" | InferenceMode;

export function HistoryPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<FilterStatus>("all");
  const [mode, setMode] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");

  const history = useQuery(api.jobs.getHistoryJobs, {
    status: status === "all" ? undefined : status,
    mode: mode === "all" ? undefined : mode,
    search: search || undefined,
    limit: 120,
  });

  const countLabel = useMemo(() => {
    if (!history) return "Loading...";
    return `${history.length} records`;
  }, [history]);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold">Inspections History</h2>
        <p className="mt-1 text-sm text-slate-600">
          Browse past site checks and review old records.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by check id or note"
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as FilterStatus)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All status</option>
            <option value="pending">Waiting</option>
            <option value="processing">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as FilterMode)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All check types</option>
            <option value="both">Complete Safety Scan</option>
            <option value="ppe_only">Worker PPE Check</option>
            <option value="crack_only">Structural Crack Check</option>
          </select>
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-500">{countLabel}</p>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[1.5fr_1fr_1fr_auto] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-600 md:grid">
          <span>Inspection</span>
          <span>Type</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        {history?.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No records match your filters.</p>
        ) : null}
        {history?.map((job) => (
          <div
            key={job._id}
            className="grid gap-2 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0 md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-center"
          >
            <div>
              <p className="font-semibold text-slate-900">#{job._id.slice(-8).toUpperCase()}</p>
              <p className="text-xs text-slate-500">
                {new Date(job._creationTime).toLocaleString()}
              </p>
            </div>
            <p className="font-medium text-slate-700">{modeLabels[job.mode]}</p>
            <div>
              <StatusBadge status={job.status} />
            </div>
            <button
              type="button"
              onClick={() => navigate(`/history/${job._id}`)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Open
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
