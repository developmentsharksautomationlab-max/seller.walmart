"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";

export type CardStatus = "meets" | "monitor" | "none";

export type Metric = {
  key: string;
  title: string;
  period: string;
  available: boolean;
  value: string; // big value, e.g. "98", "0.1", "1", "4.3"
  isPercent: boolean; // render a trailing "%"
  suffix?: string; // inline text after the value, e.g. " of 3 carriers"
  standard?: string; // percent cards: "Standard: above 95%"
  status: CardStatus; // percent cards: drives the badge
  descriptor?: string; // stat cards: line under the value
  about: string;
  howCalc: string;
  detail?: { label: string; text: string };
};

function StatusBadge({ status }: { status: CardStatus }) {
  if (status === "meets")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Meets standard
      </span>
    );
  if (status === "monitor")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
        <AlertTriangle className="h-3.5 w-3.5" />
        Monitor
      </span>
    );
  return null;
}

function ValueDisplay({ m, big = false }: { m: Metric; big?: boolean }) {
  if (!m.available)
    return <span className="text-2xl font-bold text-slate-900">Not available</span>;
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span
        className={`${big ? "text-4xl" : "text-2xl"} font-bold tracking-tight text-slate-900`}
      >
        {m.value}
      </span>
      {m.isPercent && <span className="text-lg font-semibold text-slate-500">%</span>}
      {m.suffix && <span className="text-sm text-slate-600">{m.suffix}</span>}
    </span>
  );
}

export default function PerformanceCards({ metrics }: { metrics: Metric[] }) {
  const [active, setActive] = useState<Metric | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <div
            key={m.key}
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h3 className="text-sm font-bold text-slate-900">{m.title}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{m.period}</p>

            <div className="mt-3">
              <ValueDisplay m={m} big />
            </div>

            {m.standard ? (
              <>
                <p className="mt-2 text-xs text-slate-500">{m.standard}</p>
                <div className="mt-3">
                  <StatusBadge status={m.status} />
                </div>
              </>
            ) : (
              m.descriptor && (
                <p className="mt-2 text-sm text-slate-600">{m.descriptor}</p>
              )
            )}

            <div className="mt-auto flex justify-center pt-6">
              <button
                type="button"
                onClick={() => setActive(m)}
                className="rounded-full border border-slate-300 bg-white px-5 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                View details
              </button>
            </div>
          </div>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setActive(null)}
            className="absolute inset-0 cursor-default bg-slate-900/40"
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{active.title}</h3>
                <p className="text-xs text-slate-500">{active.period}</p>
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Current</p>
                <div className="mt-0.5">
                  <ValueDisplay m={active} />
                </div>
              </div>
              <StatusBadge status={active.status} />
            </div>

            {active.standard ? (
              <>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Standard
                </p>
                <p className="text-sm text-slate-700">
                  {active.standard.replace(/^Standard:\s*/, "")}
                </p>
              </>
            ) : (
              active.descriptor && (
                <>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Status
                  </p>
                  <p className="text-sm text-slate-700">{active.descriptor}</p>
                </>
              )
            )}

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
              About this metric
            </p>
            <p className="text-sm text-slate-700">{active.about}</p>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
              How it&apos;s measured here
            </p>
            <p className="text-sm text-slate-700">{active.howCalc}</p>

            {active.detail && (
              <>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {active.detail.label}
                </p>
                <p className="text-sm text-slate-700">{active.detail.text}</p>
              </>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setActive(null)}
                className="rounded-full bg-wm-blue px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-wm-blue-dark"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
