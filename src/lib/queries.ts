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
function pct(cur: number, prior: number): number | null {
  return prior > 0 ? round1(((cur - prior) / prior) * 100) : null;
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
  const cmp = sales.filter((o) => inRange(o.createdAt, compare.start, compare.end));

  const curGmv = metricOf(cur, "gmv");
  const priorGmv = metricOf(cmp, "gmv");
  const curUnits = metricOf(cur, "units");
  const priorUnits = metricOf(cmp, "units");
  const curOrders = cur.length;
  const priorOrders = cmp.length;
  const curAur = metricOf(cur, "aur");
  const priorAur = metricOf(cmp, "aur");

  const kpis: Kpi[] = [
    {
      key: "gmv",
      label: "GMV",
      value: currency0.format(curGmv),
      priorValue: currency0.format(priorGmv),
      change: pct(curGmv, priorGmv),
    },
    {
      key: "units",
      label: "Units Sold",
      value: curUnits.toLocaleString(),
      priorValue: priorUnits.toLocaleString(),
      change: pct(curUnits, priorUnits),
    },
    {
      key: "orders",
      label: "Orders",
      value: curOrders.toLocaleString(),
      priorValue: priorOrders.toLocaleString(),
      change: pct(curOrders, priorOrders),
    },
    {
      key: "aur",
      label: "AUR",
      value: currency2.format(curAur),
      priorValue: currency2.format(priorAur),
      change: pct(curAur, priorAur),
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
    const pbStart = new Date(compare.start.getTime() + i * bucketMs);
    const pbEnd = new Date(Math.min(pbStart.getTime() + bucketMs, compare.end.getTime()));
    const curBucket = sales.filter((o) => o.createdAt >= bStart && o.createdAt < bEnd);
    const priorBucket =
      pbStart.getTime() < compare.end.getTime()
        ? sales.filter((o) => o.createdAt >= pbStart && o.createdAt < pbEnd)
        : [];
    const label = bStart.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    });
    for (const m of metrics) {
      series[m].push({
        label,
        value: metricOf(curBucket, m),
        prior: metricOf(priorBucket, m),
      });
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
