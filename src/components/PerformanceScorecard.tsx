import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { PerfMetric, PerfStatus } from "@/lib/queries";

const STATUS: Record<
  PerfStatus,
  { dot: string; text: string; icon: typeof CheckCircle2; label: string }
> = {
  good: { dot: "bg-emerald-500", text: "text-emerald-700", icon: CheckCircle2, label: "On track" },
  warn: { dot: "bg-amber-500", text: "text-amber-700", icon: AlertTriangle, label: "Monitor" },
  bad: { dot: "bg-rose-500", text: "text-rose-700", icon: XCircle, label: "At risk" },
};

export default function PerformanceScorecard({ metrics }: { metrics: PerfMetric[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-wm-navy">Performance</h2>
      <p className="text-xs text-slate-500">Seller standards for this period</p>

      <ul className="mt-4 divide-y divide-slate-100">
        {metrics.map((m) => {
          const s = STATUS[m.status];
          const Icon = s.icon;
          return (
            <li key={m.label} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} />
                <div>
                  <p className="text-sm font-medium text-slate-900">{m.label}</p>
                  <p className="text-xs text-slate-400">{m.target}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-wm-navy">{m.value}</p>
                <p className={`inline-flex items-center gap-1 text-xs font-medium ${s.text}`}>
                  <Icon className="h-3 w-3" />
                  {s.label}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
