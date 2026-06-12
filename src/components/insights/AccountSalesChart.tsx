"use client";

import { useState } from "react";
import type { SeriesPoint } from "@/lib/queries";

const W = 900;
const H = 320;
const PAD_L = 64;
const PAD_R = 64;
const PAD_T = 20;
const PAD_B = 38;

// Purple palette to match Walmart's Sales Insights chart.
const LINE = "#8b5cf6";
const PRIOR = "#c4b5fd";

export default function AccountSalesChart({
  points,
  format,
}: {
  points: SeriesPoint[];
  format: (n: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const n = points.length;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const all = [...points.map((p) => p.value), ...points.map((p) => p.prior), 0];
  const max = Math.max(...all);
  const min = Math.min(...all);
  const span = max - min || 1;

  const x = (i: number) => PAD_L + (n <= 1 ? 0.5 : i / (n - 1)) * innerW;
  const y = (v: number) => PAD_T + (1 - (v - min) / span) * innerH;

  const toPath = (key: "value" | "prior") =>
    points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p[key]).toFixed(1)}`)
      .join(" ");

  const baseline = y(Math.max(min, 0));
  const linePath = toPath("value");
  const areaPath =
    n > 0
      ? `${linePath} L ${x(n - 1).toFixed(1)} ${baseline.toFixed(1)} L ${x(0).toFixed(1)} ${baseline.toFixed(1)} Z`
      : "";

  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const labelStep = Math.max(1, Math.ceil(n / 7));
  const hasData = max !== 0 || min !== 0;

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (n === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width; // 0..1 across the box
    const t = (fx - PAD_L / W) / (innerW / W); // 0..1 across the plot
    const idx = Math.min(n - 1, Math.max(0, Math.round(t * (n - 1))));
    setHover(idx);
  }

  const hp = hover != null ? points[hover] : null;

  return (
    <div
      className="relative"
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: "auto", aspectRatio: `${W} / ${H}` }}
        role="img"
        aria-label="Account sales trend with prior-period comparison"
      >
        <defs>
          <linearGradient id="asFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={LINE} stopOpacity="0.22" />
            <stop offset="100%" stopColor={LINE} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* gridlines + left/right axis labels */}
        {ticks.map((t) => {
          const gy = PAD_T + t * innerH;
          const val = max - t * span;
          return (
            <g key={t}>
              <line x1={PAD_L} x2={W - PAD_R} y1={gy} y2={gy} stroke="#eef2f6" strokeWidth={1} />
              <text x={PAD_L - 10} y={gy + 4} textAnchor="end" fontSize={12} className="fill-slate-400">
                {format(val)}
              </text>
              <text x={W - PAD_R + 10} y={gy + 4} textAnchor="start" fontSize={12} className="fill-slate-300">
                {format(val)}
              </text>
            </g>
          );
        })}

        {min < 0 && max > 0 && (
          <line x1={PAD_L} x2={W - PAD_R} y1={y(0)} y2={y(0)} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="2 3" />
        )}

        {hasData && <path d={areaPath} fill="url(#asFill)" />}

        {/* prior period (dashed) */}
        <path d={toPath("prior")} fill="none" stroke={PRIOR} strokeWidth={2} strokeDasharray="6 5" strokeLinecap="round" />

        {/* current period */}
        <path d={linePath} fill="none" stroke={LINE} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {n <= 31 &&
          points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.value)} r={2.5} fill={LINE} />)}

        {/* hover crosshair + emphasized markers */}
        {hp && (
          <g>
            <line x1={x(hover!)} x2={x(hover!)} y1={PAD_T} y2={H - PAD_B} stroke={LINE} strokeWidth={1} strokeOpacity={0.4} />
            <circle cx={x(hover!)} cy={y(hp.prior)} r={4} fill="#fff" stroke={PRIOR} strokeWidth={2} />
            <circle cx={x(hover!)} cy={y(hp.value)} r={4.5} fill={LINE} stroke="#fff" strokeWidth={2} />
          </g>
        )}

        {/* x axis labels */}
        {points.map((p, i) =>
          i % labelStep === 0 || i === n - 1 ? (
            <text key={`x-${i}`} x={x(i)} y={H - 12} textAnchor="middle" fontSize={12} className="fill-violet-600">
              {p.label}
            </text>
          ) : null,
        )}
      </svg>

      {/* tooltip */}
      {hp && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[115%] whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: `${(x(hover!) / W) * 100}%`, top: `${(y(hp.value) / H) * 100}%` }}
        >
          <p className="mb-1 font-semibold text-slate-900">{hp.label}</p>
          <p className="flex items-center gap-1.5 text-slate-600">
            <span className="h-0.5 w-3 rounded bg-violet-500" />
            This period: <span className="font-semibold text-slate-900">{format(hp.value)}</span>
          </p>
          <p className="flex items-center gap-1.5 text-slate-500">
            <span className="h-0 w-3 border-t-2 border-dashed border-violet-300" />
            Prior: <span className="font-medium text-slate-700">{format(hp.prior)}</span>
          </p>
        </div>
      )}

      {!hasData && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-400">
          No sales in this period
        </p>
      )}
    </div>
  );
}
