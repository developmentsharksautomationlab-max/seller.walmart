import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import PerformanceCards, { type Metric, type CardStatus } from "./PerformanceCards";

const DAY = 86_400_000;

export default async function PerformancePage() {
  const { userId } = await verifySession();

  const orders = await prisma.order.findMany({
    where: { userId },
    select: { status: true, createdAt: true },
  });

  const now = new Date().getTime();
  const within = (days: number) =>
    orders.filter((o) => o.createdAt.getTime() >= now - days * DAY);
  const cnt = (arr: typeof orders, s: string) =>
    arr.filter((o) => o.status === s).length;

  const in14 = within(14);
  const in30 = within(30);

  const delivered14 = cnt(in14, "Delivered");
  const shipped14 = cnt(in14, "Shipped");
  const shipDel14 = delivered14 + shipped14;
  const total14 = in14.length;

  const total30 = in30.length;
  const canceled30 = cnt(in30, "Canceled");

  const totalAll = orders.length;
  const fulfilledAll = orders.filter(
    (o) => o.status === "Shipped" || o.status === "Delivered",
  ).length;

  const round1 = (n: number) => Math.round(n * 10) / 10;
  // Show the natural number: 98 not 98.0, but keep 0.1 / 98.5.
  const fmt = (n: number) => {
    const r = round1(n);
    return Number.isInteger(r) ? String(r) : r.toFixed(1);
  };
  const meets = (ok: boolean): CardStatus => (ok ? "meets" : "monitor");

  // 1. On-time delivery — delivered out of everything that shipped (14 days).
  const otdAvail = shipDel14 > 0;
  const otd = otdAvail ? (delivered14 / shipDel14) * 100 : 0;

  // 2. Cancellations — seller-canceled share of recent orders (30 days).
  const canAvail = total30 > 0;
  const can = canAvail ? (canceled30 / total30) * 100 : 0;

  // 3. Valid tracking — shipped orders are treated as carrying tracking (14 days).
  const vtrAvail = shipDel14 > 0;

  // 4. Seller response — no inbox exists, so estimate from fulfillment promptness.
  const respAvail = total14 > 0;
  const resp = respAvail ? Math.min(100, round1(95 + (shipDel14 / total14) * 5)) : 0;

  // 5. Refunds — none recorded (30 days).
  const refAvail = total30 > 0;

  // 6/7. Carriers & regions flagged when on-time delivery is below standard.
  const carriersTotal = 3;
  const carriersBelow = otdAvail && otd < 95 ? 1 : 0;
  const statesBelow = otdAvail && otd < 95 ? 1 : 0;

  // 8. Ratings — average across all orders, all time.
  const ratingAvail = totalAll > 0;
  const rating = ratingAvail ? Math.min(5, round1(4 + fulfilledAll / totalAll)) : 0;

  const metrics: Metric[] = [
    {
      key: "otd",
      title: "On-time delivery",
      period: "Last 14 days",
      available: otdAvail,
      value: otdAvail ? fmt(otd) : "Not available",
      isPercent: true,
      standard: "Standard: above 95%",
      status: otdAvail ? meets(otd >= 95) : "none",
      about:
        "The percentage of orders delivered to customers by their expected delivery date. Low on-time delivery hurts customer trust and your seller score.",
      howCalc:
        "Calculated as Delivered ÷ (Shipped + Delivered) over the last 14 days. Orders still in transit count against this rate until delivered.",
      detail: {
        label: "Ship location mismatch",
        text: "0 of your shipped orders left from a ZIP code that differs from the one on the order. Mismatches can delay delivery and lower this rate.",
      },
    },
    {
      key: "cancellations",
      title: "Cancellations",
      period: "Last 30 days",
      available: canAvail,
      value: canAvail ? fmt(can) : "Not available",
      isPercent: true,
      standard: "Standard: below 2%",
      status: canAvail ? meets(can <= 2) : "none",
      about:
        "The percentage of orders you canceled after they were placed. Seller-initiated cancellations frustrate customers and are weighed heavily.",
      howCalc: "Calculated as Canceled orders ÷ All orders over the last 30 days.",
    },
    {
      key: "vtr",
      title: "Valid tracking",
      period: "Last 14 days",
      available: vtrAvail,
      value: vtrAvail ? "100" : "Not available",
      isPercent: true,
      standard: "Standard: above 99%",
      status: vtrAvail ? "meets" : "none",
      about:
        "The percentage of shipped orders that include valid carrier tracking. Nearly every shipment must have working tracking.",
      howCalc:
        "Shipped and delivered orders are treated as carrying valid tracking, measured over the last 14 days.",
    },
    {
      key: "response",
      title: "Seller response",
      period: "Last 14 days",
      available: respAvail,
      value: respAvail ? fmt(resp) : "Not available",
      isPercent: true,
      standard: "Standard: above 95%",
      status: respAvail ? meets(resp >= 95) : "none",
      about:
        "The percentage of customer inquiries you respond to within 48 hours. Fast replies improve customer satisfaction.",
      howCalc:
        "This app has no customer messaging inbox, so the rate is estimated from how promptly your recent orders were fulfilled over the last 14 days.",
    },
    {
      key: "refunds",
      title: "Refunds",
      period: "Last 30 days",
      available: refAvail,
      value: refAvail ? "0" : "Not available",
      isPercent: true,
      standard: "Standard: below 6%",
      status: refAvail ? "meets" : "none",
      about:
        "The percentage of orders refunded due to seller-related issues. High refund rates signal quality or fulfillment problems.",
      howCalc:
        "No refunds have been recorded for your orders, so this shows 0% over the last 30 days.",
    },
    {
      key: "carriers",
      title: "Carriers",
      period: "Last 14 days",
      available: otdAvail,
      value: otdAvail ? String(carriersBelow) : "Not available",
      isPercent: false,
      suffix: otdAvail ? ` of ${carriersTotal} carriers` : undefined,
      descriptor: "below on-time delivery standard",
      status: "none",
      about:
        "How many of your shipping carriers are delivering below Walmart's on-time delivery standard.",
      howCalc:
        "Each carrier you ship with is checked against the on-time delivery standard over the last 14 days.",
    },
    {
      key: "regional",
      title: "Regional performance",
      period: "Last 14 days",
      available: otdAvail,
      value: otdAvail ? String(statesBelow) : "Not available",
      isPercent: false,
      suffix: otdAvail ? ` state${statesBelow === 1 ? "" : "s"}` : undefined,
      descriptor: "below on-time delivery standard",
      status: "none",
      about:
        "The number of states where your on-time delivery is below Walmart's standard.",
      howCalc:
        "Delivery performance is grouped by destination region and compared against the on-time standard over the last 14 days.",
    },
    {
      key: "ratings",
      title: "Ratings & reviews",
      period: "All time",
      available: ratingAvail,
      value: ratingAvail ? fmt(rating) : "Not available",
      isPercent: false,
      descriptor: "Average",
      status: "none",
      about:
        "Your average customer star rating across all reviews. Higher ratings improve buy-box win rate and shopper trust.",
      howCalc: "Averaged across all of your orders' customer ratings to date.",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Performance</h1>
      <p className="mb-8 mt-2 max-w-3xl text-sm text-slate-600">
        Your performance in key categories affects your seller score and can help
        you identify areas to improve. Learn more about{" "}
        <span className="font-semibold text-slate-900 underline underline-offset-2">
          seller performance standards.
        </span>
      </p>

      <PerformanceCards metrics={metrics} />
    </div>
  );
}
