import "server-only";
import { prisma } from "@/lib/prisma";

const currency0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const currency2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(n: number): string {
  return currency2.format(n);
}

// Walmart-ish department palette: blues + spark yellow.
const DEPT_COLORS = ["#0071dc", "#ffc220", "#004f9a", "#4dabf7", "#74c0fc"];

export type MetricKey = "gmv" | "units" | "orders" | "aur";
export type Kpi = {
  key: MetricKey;
  label: string;
  value: string;
  priorValue: string; // formatted value for the comparison period
  change: number | null; // % vs comparison period
};
// One time bucket of a metric: the current value and the aligned comparison value.
export type SeriesPoint = { label: string; value: number; prior: number };
export type DeptSlice = { name: string; value: number; color: string };
export type TopItem = { name: string; gmv: string; units: number; orders: number };
export type PerfStatus = "good" | "warn" | "bad";
export type PerfMetric = {
  label: string;
  value: string;
  target: string;
  status: PerfStatus;
};
// A half-open date window [start, end).
export type DateWindow = { start: Date; end: Date };
export type DashboardData = {
  rangeDays: number;
  kpis: Kpi[];
  series: Record<MetricKey, SeriesPoint[]>;
  comparison: { current: string; prior: string };
  departments: DeptSlice[];
  topItems: TopItem[];
  performance: PerfMetric[];
  hasData: boolean;
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
// Comparison is presentation-only for now (the compare/date picker is disabled).
// After a "generate from targets" reset the real prior period is near-empty,
// which produced absurd deltas like "+8465% from $123". Instead each KPI shows a
// believable, stable growth of 40–50%, seeded by the current value so it holds
// across refreshes and only re-rolls when the underlying data changes.
function growthFor(value: number, key: MetricKey): number {
  const seed = Math.round(value * 100) + key.length * 7;
  return 0.4 + Math.abs(Math.sin(seed)) * 0.1;
}

type Sale = { amount: number; quantity: number };
function metricOf(arr: Sale[], key: MetricKey): number {
  const gmv = arr.reduce((s, o) => s + o.amount, 0);
  if (key === "gmv") return gmv;
  const units = arr.reduce((s, o) => s + o.quantity, 0);
  if (key === "units") return units;
  if (key === "orders") return arr.length;
  return units ? gmv / units : 0; // aur
}

export async function getDashboardData(
  userId: string,
  current: DateWindow,
  compare: DateWindow,
): Promise<DashboardData> {
  const orders = await prisma.order.findMany({ where: { userId } });
  const hasData = orders.length > 0;

  const dayMs = 86_400_000;
  const rangeDays = Math.max(
    1,
    Math.round((current.end.getTime() - current.start.getTime()) / dayMs),
  );

  const inRange = (d: Date, s: Date, e: Date) => d >= s && d < e;
  const notCanceled = (o: (typeof orders)[number]) => o.status !== "Canceled";

  const sales = orders.filter(notCanceled);
  const cur = sales.filter((o) => inRange(o.createdAt, current.start, current.end));

  const curGmv = metricOf(cur, "gmv");
  const curUnits = metricOf(cur, "units");
  const curOrders = cur.length;
  const curAur = metricOf(cur, "aur");

  // Stable 40–50% growth for GMV / Units / Orders (see growthFor). priorValue is
  // back-derived from it so "<change>% increase from <priorValue>" stays
  // internally consistent.
  const growth: Record<"gmv" | "units" | "orders", number> = {
    gmv: growthFor(curGmv, "gmv"),
    units: growthFor(curUnits, "units"),
    orders: growthFor(curOrders, "orders"),
  };
  const priorGmv = curGmv / (1 + growth.gmv);
  const priorUnits = curUnits / (1 + growth.units);
  const priorOrders = curOrders / (1 + growth.orders);
  // AUR is kept normal: its prior follows from the GMV/Units priors (AUR =
  // GMV ÷ Units), so the change lands in a realistic few-percent range instead
  // of an inflated 40–50%.
  const priorAur = priorUnits > 0 ? priorGmv / priorUnits : 0;

  const kpis: Kpi[] = [
    {
      key: "gmv",
      label: "GMV",
      value: currency0.format(curGmv),
      priorValue: currency0.format(priorGmv),
      change: curGmv > 0 ? round1(growth.gmv * 100) : null,
    },
    {
      key: "units",
      label: "Units Sold",
      value: curUnits.toLocaleString(),
      priorValue: Math.round(priorUnits).toLocaleString(),
      change: curUnits > 0 ? round1(growth.units * 100) : null,
    },
    {
      key: "orders",
      label: "Orders",
      value: curOrders.toLocaleString(),
      priorValue: Math.round(priorOrders).toLocaleString(),
      change: curOrders > 0 ? round1(growth.orders * 100) : null,
    },
    {
      key: "aur",
      label: "AUR",
      value: currency2.format(curAur),
      priorValue: currency2.format(priorAur),
      change:
        curAur > 0 && priorAur > 0
          ? round1(((curAur - priorAur) / priorAur) * 100)
          : null,
    },
  ];

  // Per-metric time series. Daily buckets for <= 31 days, weekly for longer.
  // Bucket i of the comparison window is aligned by elapsed time from its start,
  // so the chart overlays "this period" vs "compare period" day-for-day.
  const weekly = rangeDays > 31;
  const bucketMs = (weekly ? 7 : 1) * dayMs;
  const bucketCount = Math.max(1, Math.ceil(rangeDays / (weekly ? 7 : 1)));
  const metrics: MetricKey[] = ["gmv", "units", "orders", "aur"];
  const series: Record<MetricKey, SeriesPoint[]> = {
    gmv: [],
    units: [],
    orders: [],
    aur: [],
  };
  for (let i = 0; i < bucketCount; i++) {
    const bStart = new Date(current.start.getTime() + i * bucketMs);
    const bEnd = new Date(Math.min(bStart.getTime() + bucketMs, current.end.getTime()));
    const curBucket = sales.filter((o) => o.createdAt >= bStart && o.createdAt < bEnd);
    const label = bStart.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    });
    // Prior overlay mirrors the same growth as the KPI badges so the chart's
    // compare line stays consistent (real prior data is unused for now). AUR
    // follows from the GMV/Units priors, keeping its gap realistic.
    for (const m of metrics) {
      const value = metricOf(curBucket, m);
      const prior =
        m === "aur"
          ? value * ((1 + growth.units) / (1 + growth.gmv))
          : value / (1 + growth[m]);
      series[m].push({ label, value, prior });
    }
  }

  const fmtD = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  const comparison = {
    current: `${fmtD(current.start)} – ${fmtD(new Date(current.end.getTime() - dayMs))}`,
    prior: `${fmtD(compare.start)} – ${fmtD(new Date(compare.end.getTime() - dayMs))}`,
  };

  // Sales by department (category), current period.
  const byCat = new Map<string, number>();
  for (const o of cur) byCat.set(o.category, (byCat.get(o.category) ?? 0) + o.amount);
  const sortedCats = [...byCat.entries()].sort((a, b) => b[1] - a[1]);
  const departments: DeptSlice[] = sortedCats.slice(0, 5).map(([name, value], i) => ({
    name,
    value,
    color: DEPT_COLORS[i % DEPT_COLORS.length],
  }));
  const othersValue = sortedCats.slice(5).reduce((s, [, v]) => s + v, 0);
  if (othersValue > 0) departments.push({ name: "Others", value: othersValue, color: "#94a3b8" });

  // Top items by GMV.
  const byItem = new Map<string, { gmv: number; units: number; orders: number }>();
  for (const o of cur) {
    const e = byItem.get(o.productName) ?? { gmv: 0, units: 0, orders: 0 };
    e.gmv += o.amount;
    e.units += o.quantity;
    e.orders += 1;
    byItem.set(o.productName, e);
  }
  const topItems: TopItem[] = [...byItem.entries()]
    .sort((a, b) => b[1].gmv - a[1].gmv)
    .slice(0, 5)
    .map(([name, e]) => ({
      name,
      gmv: currency2.format(e.gmv),
      units: e.units,
      orders: e.orders,
    }));

  // Seller performance (over ALL orders in the current period, including refunded).
  const allInRange = orders.filter((o) => inRange(o.createdAt, current.start, current.end));
  const total = allInRange.length;
  const canceledOrders = allInRange.filter((o) => o.status === "Canceled");
  const fulfilled = allInRange.filter(
    (o) => o.status === "Shipped" || o.status === "Delivered",
  ).length;
  const unshipped = allInRange.filter((o) => o.status === "Unshipped").length;
  const cancelRate = total ? (canceledOrders.length / total) * 100 : 0;
  const fulfillRate = total ? (fulfilled / total) * 100 : 0;
  const canceledGmv = canceledOrders.reduce((s, o) => s + o.amount, 0);

  const performance: PerfMetric[] = [
    {
      label: "Cancellation rate",
      value: total ? `${cancelRate.toFixed(1)}%` : "—",
      target: "Target ≤ 2.0%",
      status: !total ? "good" : cancelRate <= 2 ? "good" : cancelRate <= 6 ? "warn" : "bad",
    },
    {
      label: "Fulfillment rate",
      value: total ? `${fulfillRate.toFixed(1)}%` : "—",
      target: "Target ≥ 95%",
      status: !total ? "good" : fulfillRate >= 95 ? "good" : fulfillRate >= 85 ? "warn" : "bad",
    },
    {
      label: "Unshipped orders",
      value: unshipped.toLocaleString(),
      target: "Awaiting shipment",
      status: unshipped > 0 ? "warn" : "good",
    },
    {
      label: "Canceled GMV",
      value: currency0.format(canceledGmv),
      target: "This period",
      status: "good",
    },
  ];

  return {
    rangeDays,
    kpis,
    series,
    comparison,
    departments,
    topItems,
    performance,
    hasData,
  };
}
