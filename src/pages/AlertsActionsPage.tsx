import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { modeLabels } from "../utils/jobs";

export function AlertsActionsPage() {
  const navigate = useNavigate();
  const alerts = useQuery(api.jobs.getAlerts);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold">Alerts & Actions</h2>
        <p className="mt-1 text-sm text-slate-600">
          Focus on high-priority safety findings that need attention on site.
        </p>
      </section>

      <section className="space-y-3">
        {alerts === undefined ? (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            Loading active alerts...
          </p>
        ) : null}
        {alerts?.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            No active alerts right now.
          </p>
        ) : null}

        {alerts?.map((alert) => (
          <article key={`${alert.jobId}-${alert.createdAt}`} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`size-4 ${alert.severity === "high" ? "text-red-600" : "text-amber-600"}`} />
                <h3 className="text-lg font-bold">{alert.issue}</h3>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  alert.severity === "high"
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {alert.severity === "high" ? "High Priority" : "Medium Priority"}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-semibold">Check Type:</span> {modeLabels[alert.mode]}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              <span className="font-semibold">Action:</span> {alert.action}
            </p>
            <p className="mt-1 text-xs text-slate-500">{new Date(alert.createdAt).toLocaleString()}</p>
            <button
              type="button"
              onClick={() => navigate(`/history/${alert.jobId}`)}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Open inspection
              <ArrowRight className="size-4" />
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}
