"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

// ---- date helpers (all local time) ----------------------------------------
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
function parseIso(s: string | undefined): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setDate(d.getDate() - d.getDay());
  return x;
}
function sameDay(a: Date | null, b: Date | null): boolean {
  return (
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function fmtUS(d: Date | null): string {
  if (!d) return "";
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(
    2,
    "0",
  )}/${d.getFullYear()}`;
}
function rangeLabel(s: Date, e: Date): string {
  const mdy = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const md = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (sameDay(s, e)) return mdy(s);
  if (s.getFullYear() === e.getFullYear()) return `${md(s)} - ${mdy(e)}`;
  return `${mdy(s)} - ${mdy(e)}`;
}

type Preset = { label: string; s: Date; e: Date };
function buildPresets(today: Date): Preset[] {
  const y = today.getFullYear();
  const q = (m0: number, m1: number, yr = y) => ({
    s: new Date(yr, m0, 1),
    e: new Date(yr, m1 + 1, 0), // last day of m1
  });
  return [
    { label: "Today", s: today, e: today },
    { label: "This Week", s: startOfWeek(today), e: today },
    { label: "This Month", s: startOfMonth(today), e: today },
    { label: "Q1", ...q(1, 3) }, // Feb – Apr (Walmart fiscal year)
    { label: "Q2", ...q(4, 6) }, // May – Jul
    { label: "Q3", ...q(7, 9) }, // Aug – Oct
    { label: "Q4", s: new Date(y, 10, 1), e: new Date(y + 1, 0, 31) }, // Nov – Jan
  ];
}

// ---- one month grid --------------------------------------------------------
function MonthGrid({
  month,
  start,
  end,
  cStart,
  cEnd,
  today,
  onPick,
}: {
  month: Date;
  start: Date | null;
  end: Date | null;
  cStart: Date | null;
  cEnd: Date | null;
  today: Date;
  onPick: (d: Date) => void;
}) {
  const y = month.getFullYear();
  const m = month.getMonth();
  const firstDow = new Date(y, m, 1).getDay();
  const dim = new Date(y, m + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(new Date(y, m, d));

  return (
    <div className="min-w-[15rem] flex-1">
      <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold text-slate-500">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={`b${i}`} className="h-10" />;

          const isStart = sameDay(day, start);
          const isEnd = sameDay(day, end);
          const between = start && end && day > start && day < end;
          const isEndpoint = isStart || isEnd;

          const cIsStart = sameDay(day, cStart);
          const cIsEnd = sameDay(day, cEnd);
          const cBetween = cStart && cEnd && day > cStart && day < cEnd;
          const cEndpoint = cIsStart || cIsEnd;

          const isToday = sameDay(day, today);
          const future = day > today && !isEndpoint;

          return (
            <div key={iso(day)} className="relative flex h-10 items-center justify-center">
              {/* compare range band (violet) */}
              {(cBetween || (cIsStart && cEnd) || (cIsEnd && cStart)) && (
                <div
                  className={`absolute inset-y-1.5 bg-violet-500/10 ${
                    cBetween ? "inset-x-0" : cIsStart ? "left-1/2 right-0" : "left-0 right-1/2"
                  }`}
                />
              )}
              {/* primary range band (blue) */}
              {(between || (isStart && end && !isEnd) || (isEnd && start && !isStart)) && (
                <div
                  className={`absolute inset-y-1 bg-wm-blue/10 ${
                    between ? "inset-x-0" : isStart ? "left-1/2 right-0" : "left-0 right-1/2"
                  }`}
                />
              )}
              <button
                type="button"
                disabled={future}
                onClick={() => onPick(day)}
                className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${
                  isEndpoint
                    ? "bg-wm-blue font-semibold text-white"
                    : cEndpoint
                      ? "border-2 border-violet-400 font-semibold text-violet-700"
                      : future
                        ? "cursor-not-allowed text-slate-300"
                        : isToday
                          ? "font-semibold text-wm-blue underline underline-offset-4 hover:bg-slate-100"
                          : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {day.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- the popover ------------------------------------------------------------
export default function DateRangePicker({
  currentLabel,
  priorLabel,
  defaults,
}: {
  currentLabel: string;
  priorLabel: string;
  defaults: {
    start: string;
    end: string;
    compareOn: boolean;
    cStart: string;
    cEnd: string;
  };
}) {
  const router = useRouter();
  const now = new Date();
  const realToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [open, setOpen] = useState(false);
  const [start, setStart] = useState<Date | null>(parseIso(defaults.start));
  const [end, setEnd] = useState<Date | null>(parseIso(defaults.end));
  const [compareOn, setCompareOn] = useState(defaults.compareOn);
  const [cStart, setCStart] = useState<Date | null>(parseIso(defaults.cStart));
  const [cEnd, setCEnd] = useState<Date | null>(parseIso(defaults.cEnd));
  const [active, setActive] = useState<"primary" | "compare">("primary");
  const [view, setView] = useState<Date>(
    startOfMonth(parseIso(defaults.start) ?? realToday),
  );

  const presets = buildPresets(realToday);

  function pick(day: Date) {
    if (active === "compare") {
      if (!cStart || (cStart && cEnd)) {
        setCStart(day);
        setCEnd(null);
      } else if (day < cStart) {
        setCEnd(cStart);
        setCStart(day);
      } else {
        setCEnd(day);
      }
      return;
    }
    if (!start || (start && end)) {
      setStart(day);
      setEnd(null);
    } else if (day < start) {
      setEnd(start);
      setStart(day);
    } else {
      setEnd(day);
    }
  }

  function applyPreset(p: Preset) {
    setActive("primary");
    setStart(p.s);
    setEnd(p.e);
    setView(startOfMonth(p.s));
  }

  function apply() {
    if (!start) return;
    const e = end ?? start;
    let url = `/?s=${iso(start)}&e=${iso(e)}`;
    if (compareOn && cStart) {
      url += `&cs=${iso(cStart)}&ce=${iso(cEnd ?? cStart)}`;
    }
    setOpen(false);
    router.push(url, { scroll: false });
  }

  const fieldBase =
    "w-full rounded-lg border px-3 py-2.5 text-left text-sm text-slate-900 transition";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full border border-wm-blue/40 px-3.5 py-2 text-sm transition-colors hover:bg-wm-blue/5"
      >
        <Calendar className="h-4 w-4 shrink-0 text-wm-blue" />
        <span className="text-left">
          <span className="font-semibold text-wm-blue">Comparing: </span>
          <span className="text-slate-700">{currentLabel}</span>
          <span className="text-wm-blue"> to </span>
          <span className="text-slate-700">{priorLabel}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-wm-blue" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-slate-900/40"
          />
          <div className="relative z-10 flex max-h-[calc(100vh-2rem)] w-[44rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex max-h-[34rem] flex-col sm:flex-row">
              {/* left: compare toggle + presets */}
              <div className="flex w-full shrink-0 flex-col border-b border-slate-200 sm:w-56 sm:border-b-0 sm:border-r">
                <div className="p-4">
                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-2.5">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={compareOn}
                      onClick={() => {
                        const next = !compareOn;
                        setCompareOn(next);
                        setActive(next ? "compare" : "primary");
                      }}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                        compareOn ? "bg-wm-blue" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                          compareOn ? "left-[22px]" : "left-0.5"
                        }`}
                      />
                    </button>
                    <span className="text-sm font-semibold text-slate-900">Compare</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Compare performance data across date ranges.
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto px-2 pb-2">
                  {presets.map((p) => {
                    const on = sameDay(p.s, start) && sameDay(p.e, end);
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => applyPreset(p)}
                        className={`mb-1 w-full rounded-lg px-3 py-2 text-left transition-colors ${
                          on ? "bg-wm-blue/10" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="text-sm font-bold text-slate-900">{p.label}</div>
                        <div className="text-sm text-wm-blue">{rangeLabel(p.s, p.e)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* right: date fields + dual calendar */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-1 text-sm font-semibold text-slate-700">Start date</p>
                    <button
                      type="button"
                      onClick={() => setActive("primary")}
                      className={`${fieldBase} ${
                        active === "primary" ? "border-wm-blue ring-2 ring-wm-blue/20" : "border-slate-300"
                      }`}
                    >
                      {fmtUS(start) || "—"}
                    </button>
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-semibold text-slate-700">End date</p>
                    <button
                      type="button"
                      onClick={() => setActive("primary")}
                      className={`${fieldBase} ${
                        active === "primary" ? "border-wm-blue ring-2 ring-wm-blue/20" : "border-slate-300"
                      }`}
                    >
                      {fmtUS(end) || "—"}
                    </button>
                  </div>
                </div>

                {compareOn && (
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <p className="mb-1 text-sm font-semibold text-violet-700">
                        Compare start
                      </p>
                      <button
                        type="button"
                        onClick={() => setActive("compare")}
                        className={`${fieldBase} ${
                          active === "compare"
                            ? "border-violet-500 ring-2 ring-violet-500/20"
                            : "border-slate-300"
                        }`}
                      >
                        {fmtUS(cStart) || "—"}
                      </button>
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-semibold text-violet-700">
                        Compare end
                      </p>
                      <button
                        type="button"
                        onClick={() => setActive("compare")}
                        className={`${fieldBase} ${
                          active === "compare"
                            ? "border-violet-500 ring-2 ring-violet-500/20"
                            : "border-slate-300"
                        }`}
                      >
                        {fmtUS(cEnd) || "—"}
                      </button>
                    </div>
                  </div>
                )}

                {/* month nav */}
                <div className="mt-5 flex items-center">
                  <button
                    type="button"
                    onClick={() => setView((v) => addMonths(v, -1))}
                    className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="grid flex-1 grid-cols-2 text-center">
                    <span className="text-base font-bold text-slate-900">
                      {view.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      {addMonths(view, 1).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setView((v) => addMonths(v, 1))}
                    className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-3 flex gap-6">
                  <MonthGrid
                    month={view}
                    start={start}
                    end={end}
                    cStart={compareOn ? cStart : null}
                    cEnd={compareOn ? cEnd : null}
                    today={realToday}
                    onPick={pick}
                  />
                  <MonthGrid
                    month={addMonths(view, 1)}
                    start={start}
                    end={end}
                    cStart={compareOn ? cStart : null}
                    cEnd={compareOn ? cEnd : null}
                    today={realToday}
                    onPick={pick}
                  />
                </div>
              </div>
            </div>

            {/* footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={apply}
                disabled={!start}
                className="rounded-full bg-wm-blue px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-wm-blue-dark disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
