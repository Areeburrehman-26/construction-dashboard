import { useQuery } from "convex/react";
import { BarChart3, HardHat, ShieldCheck, TriangleAlert } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { SafetyMetricCard } from "../components/SafetyMetricCard";

export function SafetyTrendsPage() {
  const overview = useQuery(api.jobs.getSafetyOverview);

  const hardhatRate = overview?.totalWorkers
    ? Math.round((Math.min(overview.totalHardhats, overview.totalWorkers) / overview.totalWorkers) * 100)
    : 0;
  const vestRate = overview?.totalWorkers
    ? Math.round((Math.min(overview.totalVests, overview.totalWorkers) / overview.totalWorkers) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <BarChart3 className="size-5 text-amber-600" />
          Safety Trends
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          A quick overview of recent safety performance across all uploaded inspections.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SafetyMetricCard title="PPE Compliance" value={`${overview?.ppeComplianceRate ?? 0}%`} tone="good" />
        <SafetyMetricCard title="Crack Alerts" value={overview?.crackAlerts ?? 0} tone="danger" />
        <SafetyMetricCard title="Workers Seen" value={overview?.totalWorkers ?? 0} />
        <SafetyMetricCard title="Pending Follow-up" value={overview?.pendingActions ?? 0} tone="warning" />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <HardHat className="size-5 text-amber-600" />
            <h3 className="text-lg font-bold">Hardhat Trend</h3>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{hardhatRate}%</p>
          <p className="mt-1 text-sm text-slate-600">
            Hardhats detected against total workers seen.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-emerald-600" />
            <h3 className="text-lg font-bold">Vest Trend</h3>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{vestRate}%</p>
          <p className="mt-1 text-sm text-slate-600">
            Safety vest detection against total workers seen.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <TriangleAlert className="size-5 text-red-600" />
            <h3 className="text-lg font-bold">Risk Trend</h3>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{overview?.crackAlerts ?? 0}</p>
          <p className="mt-1 text-sm text-slate-600">
            Inspections flagged with structural crack concern.
          </p>
        </div>
      </section>
    </div>
  );
}
