import Link from "next/link";
import { Tag, ShoppingCart, UploadCloud } from "lucide-react";
import SalesInsights from "@/components/insights/SalesInsights";
import SideRailTabs from "@/components/insights/SideRailTabs";
import { verifySession } from "@/lib/dal";
import { getAcctPrefix } from "@/lib/acct-server";
import { getDashboardData, type DateWindow } from "@/lib/queries";

const ALLOWED_RANGES = [7, 30, 90];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY = 86_400_000;

function parseIso(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d); // local midnight
}
function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    s?: string;
    e?: string;
    cs?: string;
    ce?: string;
  }>;
}) {
  const { userId } = await verifySession();
  const prefix = await getAcctPrefix();
  const sp = await searchParams;

  let current: DateWindow;
  let compare: DateWindow;
  let activeRange: number | undefined;
  let compareOn = false;
  let cStartStr: string;
  let cEndStr: string;

  if (sp.s && sp.e && DATE_RE.test(sp.s) && DATE_RE.test(sp.e)) {
    // Custom date range from the calendar picker. End is inclusive.
    const sDate = parseIso(sp.s);
    const eDate = parseIso(sp.e);
    const lo = sDate <= eDate ? sDate : eDate;
    const hi = sDate <= eDate ? eDate : sDate;
    current = { start: lo, end: new Date(hi.getTime() + DAY) };

    if (sp.cs && sp.ce && DATE_RE.test(sp.cs) && DATE_RE.test(sp.ce)) {
      // Explicit comparison range.
      const cs = parseIso(sp.cs);
      const ce = parseIso(sp.ce);
      const clo = cs <= ce ? cs : ce;
      const chi = cs <= ce ? ce : cs;
      compare = { start: clo, end: new Date(chi.getTime() + DAY) };
      compareOn = true;
      cStartStr = iso(clo);
      cEndStr = iso(chi);
    } else {
      // Auto-compare to the equal-length period immediately before.
      const span = current.end.getTime() - current.start.getTime();
      compare = {
        start: new Date(current.start.getTime() - span),
        end: current.start,
      };
      cStartStr = iso(compare.start);
      cEndStr = iso(new Date(compare.end.getTime() - DAY));
    }
  } else {
    // Rolling range mode (7/30/90 days), comparing to the period just before.
    const parsed = Number(sp.range);
    activeRange = ALLOWED_RANGES.includes(parsed) ? parsed : 30;
    const end = new Date();
    const start = new Date(end.getTime() - activeRange * DAY);
    const cStart = new Date(start.getTime() - activeRange * DAY);
    current = { start, end };
    compare = { start: cStart, end: start };
    cStartStr = iso(cStart);
    cEndStr = iso(new Date(start.getTime() - DAY));
  }

  const data = await getDashboardData(userId, current, compare);

  const pickerDefaults = {
    start: iso(current.start),
    end: iso(new Date(current.end.getTime() - DAY)), // inclusive end for display
    compareOn,
    cStart: cStartStr,
    cEnd: cEndStr,
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      {!data.hasData && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h2 className="text-sm font-bold text-wm-navy">
            Welcome to Seller Center 👋
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            You have no sales yet. Add an item, record an order, or bulk-import a
            file — your sales insights below will populate automatically.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`${prefix}/products`}
              className="inline-flex items-center gap-2 rounded-lg bg-wm-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-wm-blue-dark"
            >
              <Tag className="h-4 w-4" />
              Add an item
            </Link>
            <Link
              href={`${prefix}/import`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-wm-blue transition-colors hover:bg-slate-50"
            >
              <ShoppingCart className="h-4 w-4" />
              Record an order
            </Link>
            <Link
              href={`${prefix}/import`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-wm-blue transition-colors hover:bg-slate-50"
            >
              <UploadCloud className="h-4 w-4" />
              Import data
            </Link>
          </div>
        </div>
      )}

      <SalesInsights
        data={data}
        pickerDefaults={pickerDefaults}
        activeRange={activeRange}
      />
      <SideRailTabs />
    </div>
  );
}
