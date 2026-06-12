import type { DeptSlice } from "@/lib/queries";

const SIZE = 150;
const STROKE = 20;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

const compactMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export default function SalesByDepartment({ data }: { data: DeptSlice[] }) {
  const total = data.reduce((sum, c) => sum + c.value, 0);
  const isEmpty = total <= 0;

  const dashes = data.map((c) => (total > 0 ? (c.value / total) * CIRC : 0));
  const segments = data.map((c, i) => ({
    ...c,
    dasharray: `${dashes[i]} ${CIRC - dashes[i]}`,
    dashoffset: -dashes.slice(0, i).reduce((s, d) => s + d, 0),
    pct: total > 0 ? Math.round((c.value / total) * 100) : 0,
  }));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-wm-navy">Sales by department</h2>
      <p className="text-xs text-slate-500">Share of GMV</p>

      <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full -rotate-90">
            <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#eef2f6" strokeWidth={STROKE} />
            {segments.map((s) => (
              <circle
                key={s.name}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={s.color}
                strokeWidth={STROKE}
                strokeDasharray={s.dasharray}
                strokeDashoffset={s.dashoffset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-wm-navy">
              {compactMoney.format(total)}
            </span>
            <span className="text-xs text-slate-400">GMV</span>
          </div>
        </div>

        {isEmpty ? (
          <p className="text-sm text-slate-400">No sales in this period</p>
        ) : (
          <ul className="w-full space-y-2.5 sm:w-auto">
            {segments.map((s) => (
              <li key={s.name} className="flex items-center gap-3 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="flex-1 text-slate-600">{s.name}</span>
                <span className="font-semibold text-slate-900">{s.pct}%</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
