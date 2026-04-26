import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { FileDown } from "lucide-react";
import { api } from "../../convex/_generated/api";

export function ReportsPage() {
  const navigate = useNavigate();
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const history = useQuery(api.jobs.getHistoryJobs, { limit: 30 });
  const overview = useQuery(api.jobs.getSafetyOverview);

  const selectedJob = history?.find((job) => job._id === selectedJobId);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold">Reports</h2>
        <p className="mt-1 text-sm text-slate-600">
          Create printable safety records for audit, class review, or site meetings.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold">Weekly Snapshot</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Checks Run</p>
            <p className="mt-1 text-2xl font-bold">{overview?.totalInspections ?? 0}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Completed</p>
            <p className="mt-1 text-2xl font-bold">{overview?.completedInspections ?? 0}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">PPE Compliance</p>
            <p className="mt-1 text-2xl font-bold">{overview?.ppeComplianceRate ?? 0}%</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Crack Alerts</p>
            <p className="mt-1 text-2xl font-bold">{overview?.crackAlerts ?? 0}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold">Print Inspection Report</h3>
        <p className="mt-1 text-sm text-slate-600">
          Select any previous check and open the print-ready report page.
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <select
            value={selectedJobId}
            onChange={(event) => setSelectedJobId(event.target.value)}
            className="min-w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Choose inspection</option>
            {history?.map((job) => (
              <option key={job._id} value={job._id}>
                {new Date(job._creationTime).toLocaleDateString()} - #{job._id.slice(-8).toUpperCase()}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => selectedJobId && navigate(`/history/${selectedJobId}`)}
            disabled={!selectedJob}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <FileDown className="size-4" />
            Open Printable Report
          </button>
        </div>
      </section>
    </div>
  );
}
