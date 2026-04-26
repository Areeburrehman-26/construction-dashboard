type SafetyMetricCardProps = {
  title: string;
  value: string | number;
  tone?: "neutral" | "good" | "warning" | "danger";
  note?: string;
};

const toneClasses = {
  neutral: "bg-white text-slate-900",
  good: "bg-emerald-50 text-emerald-900",
  warning: "bg-amber-50 text-amber-900",
  danger: "bg-red-50 text-red-900",
};

export function SafetyMetricCard({
  title,
  value,
  tone = "neutral",
  note,
}: SafetyMetricCardProps) {
  return (
    <div className={`rounded-xl border border-slate-200 p-4 shadow-sm ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {note ? <p className="mt-1 text-xs opacity-80">{note}</p> : null}
    </div>
  );
}
