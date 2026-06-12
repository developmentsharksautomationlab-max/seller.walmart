"use client";

import type { Kpi, MetricKey } from "@/lib/queries";

function Triangle({ up, className = "" }: { up: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 10 8" className={`h-2 w-2.5 ${className}`} aria-hidden>
      {up ? <path d="M5 0l5 8H0z" fill="currentColor" /> : <path d="M5 8L0 0h10z" fill="currentColor" />}
    </svg>
  );
}

export default function KpiBar({
  kpis,
  active,
  onSelect,
}: {
  kpis: Kpi[];
  active: MetricKey;
  onSelect: (key: MetricKey) => void;
}) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-slate-200 sm:grid-cols-4">
      {kpis.map((kpi) => {
        const isActive = kpi.key === active;
        const hasChange = kpi.change !== null;
        const up = (kpi.change ?? 0) >= 0;
        const dir = !hasChange ? "" : up ? "increase" : "decrease";
        return (
          <button
            key={kpi.key}
            type="button"
            onClick={() => onSelect(kpi.key)}
            className={`relative border-slate-200 px-5 py-4 text-left transition-colors [&:not(:first-child)]:border-l ${
              isActive ? "bg-violet-50/60" : "hover:bg-slate-50"
            }`}
          >
            {isActive && (
              <span className="absolute inset-x-0 top-0 h-[3px] bg-violet-600" />
            )}
            <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
            <p className="mt-1 flex items-center gap-1.5 text-2xl font-bold tracking-tight text-slate-900">
              {kpi.value}
              {hasChange && (
                <Triangle
                  up={up}
                  className={up ? "text-emerald-600" : "text-rose-600"}
                />
              )}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {hasChange ? (
                <span className={up ? "text-emerald-600" : "text-rose-600"}>
                  {Math.abs(kpi.change as number)}% {dir}
                </span>
              ) : (
                <span>0%</span>
              )}{" "}
              from {kpi.priorValue}
            </p>
          </button>
        );
      })}
    </div>
  );
}
