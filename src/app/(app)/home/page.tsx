import Link from "next/link";
import {
  Info,
  MoreVertical,
  Package,
  Truck,
  Star,
  DollarSign,
  Plus,
  UploadCloud,
  BarChart3,
  ShoppingCart,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Boxes,
  PackageX,
  Megaphone,
  GraduationCap,
  Newspaper,
  type LucideIcon,
} from "lucide-react";
import { getUser, verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import SideRailTabs from "@/components/insights/SideRailTabs";
import HomeFeedbackCard from "@/components/home/HomeFeedbackCard";
import ItemThumb from "@/components/ItemThumb";

const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function compactUsd(n: number): string {
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${Math.round(n)}`;
}

type Tone = "good" | "warn" | "bad";
const TONE_DOT: Record<Tone, string> = {
  good: "bg-emerald-500",
  warn: "bg-amber-500",
  bad: "bg-rose-500",
};
const TONE_TEXT: Record<Tone, string> = {
  good: "text-emerald-600",
  warn: "text-amber-600",
  bad: "text-rose-600",
};

export default async function HomePage() {
  const { userId } = await verifySession();
  const user = await getUser();
  const firstName = (user?.name ?? "Seller").split(" ")[0];

  const [orders, products] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      select: { amount: true, status: true, createdAt: true },
    }),
    prisma.product.findMany({
      where: { userId },
      orderBy: { stock: "asc" },
      select: { id: true, name: true, category: true, price: true, stock: true },
    }),
  ]);

  // --- metrics ---
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todaysOrders = orders.filter((o) => o.createdAt >= startOfToday).length;
  const unshipped = orders.filter((o) => o.status === "Unshipped").length;
  const canceled = orders.filter((o) => o.status === "Canceled").length;
  const total = orders.length;
  const fulfilled = orders.filter(
    (o) => o.status === "Shipped" || o.status === "Delivered",
  ).length;
  const balance = orders
    .filter((o) => o.status !== "Canceled")
    .reduce((s, o) => s + o.amount, 0);
  const rating = total ? (4 + fulfilled / total).toFixed(2) : "—";
  const cancelRate = total ? (canceled / total) * 100 : 0;
  const onTimeRate = total ? (fulfilled / total) * 100 : 0;

  const stats: { label: string; value: string; icon: LucideIcon }[] = [
    { label: "Today's Orders", value: todaysOrders.toLocaleString(), icon: Package },
    { label: "Unshipped Orders", value: unshipped.toLocaleString(), icon: Truck },
    { label: "Account Rating", value: rating, icon: Star },
    { label: "Current Balance", value: usd2.format(balance), icon: DollarSign },
  ];

  // --- restock card ---
  const lowStock = products.filter((p) => p.stock <= 5);
  const candidates = lowStock.length ? lowStock : products;
  const thumbs = candidates.slice(0, 3);
  const more = Math.max(0, candidates.length - thumbs.length);
  const missed = candidates.reduce((s, p) => s + p.price * 60, 0);

  // --- grow your business ---
  const growCards: { title: string; desc: string; href: string; icon: LucideIcon }[] = [
    {
      title: "Add new products",
      desc: "Expand your catalog to reach more shoppers.",
      href: "/products",
      icon: Plus,
    },
    {
      title: "Import orders in bulk",
      desc: "Upload a spreadsheet to add many orders at once.",
      href: "/import",
      icon: UploadCloud,
    },
    {
      title: "Manage your orders",
      desc: "Ship, update and track every order in one place.",
      href: "/orders",
      icon: ShoppingCart,
    },
    {
      title: "View sales insights",
      desc: "Track GMV, units and trends over time.",
      href: "/",
      icon: BarChart3,
    },
  ];

  // --- account health ---
  const health: { label: string; value: string; hint: string; tone: Tone }[] = [
    {
      label: "On-time fulfillment",
      value: total ? `${onTimeRate.toFixed(1)}%` : "—",
      hint: "Target ≥ 95%",
      tone: !total ? "good" : onTimeRate >= 95 ? "good" : onTimeRate >= 85 ? "warn" : "bad",
    },
    {
      label: "Cancellation rate",
      value: total ? `${cancelRate.toFixed(1)}%` : "—",
      hint: "Target ≤ 2%",
      tone: !total ? "good" : cancelRate <= 2 ? "good" : cancelRate <= 6 ? "warn" : "bad",
    },
    {
      label: "Unshipped orders",
      value: unshipped.toLocaleString(),
      hint: "Awaiting shipment",
      tone: unshipped > 0 ? "warn" : "good",
    },
  ];

  // --- things to do ---
  const tasks: { text: string; cta: string; href: string; icon: LucideIcon }[] = [];
  if (unshipped > 0)
    tasks.push({
      text: `${unshipped} order${unshipped === 1 ? "" : "s"} awaiting shipment`,
      cta: "Ship now",
      href: "/orders",
      icon: Truck,
    });
  if (lowStock.length > 0)
    tasks.push({
      text: `${lowStock.length} item${lowStock.length === 1 ? "" : "s"} low on stock`,
      cta: "Restock",
      href: "/products",
      icon: Boxes,
    });
  if (canceled > 0)
    tasks.push({
      text: `${canceled} canceled order${canceled === 1 ? "" : "s"} to review`,
      cta: "Review",
      href: "/orders",
      icon: PackageX,
    });

  // --- what's new (sample announcements) ---
  const news: { tag: string; title: string; desc: string; icon: LucideIcon }[] = [
    {
      tag: "Advertising",
      title: "Sponsored Videos now available",
      desc: "Showcase your items with video ads in Walmart search.",
      icon: Megaphone,
    },
    {
      tag: "Fulfillment",
      title: "WFS expands to more categories",
      desc: "Store, pick, pack and ship with Walmart Fulfillment Services.",
      icon: Package,
    },
    {
      tag: "Learn",
      title: "Peak season readiness guide",
      desc: "Get your catalog and inventory ready for the holidays.",
      icon: GraduationCap,
    },
  ];

  return (
    <div className="-m-4 sm:-m-6">
      {/* blue welcome zone */}
      <div className="bg-gradient-to-b from-[#d8e7fd] via-[#eaf2fe] to-wm-bg px-4 pb-6 pt-6 sm:px-6">
        <div className="flex max-w-5xl flex-col gap-5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome to Seller Center, {firstName}
          </h1>

          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">
              Customer Favorites curated to meet your goals
            </h2>
            <button
              type="button"
              className="text-sm font-medium text-slate-600 underline underline-offset-2 hover:text-wm-blue"
            >
              What&apos;s this
            </button>
          </div>

          {/* restock card */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            {products.length === 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Stock your shelves to start selling
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Add items to your catalog so shoppers can find and buy them.
                  </p>
                </div>
                <Link
                  href="/products"
                  className="rounded-full bg-wm-blue px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-wm-blue-dark"
                >
                  Add items
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="max-w-md">
                  <h3 className="text-lg font-bold text-slate-900">
                    Shoppers are trying to buy your items, but they can&apos;t
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Restock to earn up to{" "}
                    <span className="font-bold text-emerald-600">{compactUsd(missed)}</span>{" "}
                    in missed monthly sales.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {thumbs.map((p) => (
                    <ItemThumb key={p.id} category={p.category} title={p.name} size="md" />
                  ))}
                  {more > 0 && (
                    <span className="text-sm font-semibold text-slate-500">+{more}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/products"
                    className="rounded-full bg-wm-blue px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-wm-blue-dark"
                  >
                    Seller-fulfilled ({candidates.length})
                  </Link>
                  <button
                    type="button"
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label="More options"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* feedback */}
          <HomeFeedbackCard />

          {/* stats */}
          <div className="grid grid-cols-2 gap-y-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:grid-cols-4 sm:gap-y-0">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className={`flex items-center gap-3 ${
                    i > 0 ? "sm:border-l sm:border-slate-200 sm:pl-5" : ""
                  }`}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-wm-blue">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 text-xs font-medium text-slate-500">
                      {s.label}
                      <Info className="h-3 w-3 text-slate-400" />
                    </p>
                    <p className="text-xl font-bold text-slate-900">{s.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* gray zone */}
      <div className="flex flex-col gap-8 px-4 pb-12 pt-4 sm:px-6">
        {/* grow your business */}
        <section className="max-w-5xl">
          <h2 className="mb-4 text-xl font-bold text-slate-900">Grow your business</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {growCards.map((c) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.title}
                  href={c.href}
                  className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-wm-blue">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-sm font-bold text-slate-900">
                      {c.title}
                      <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{c.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* account health + things to do */}
        <section className="grid max-w-5xl grid-cols-1 gap-4 lg:grid-cols-2">
          {/* account health */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Account health</h3>
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-sm font-semibold text-wm-blue hover:underline"
              >
                View details <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex flex-col divide-y divide-slate-100">
              {health.map((h) => (
                <div key={h.label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${TONE_DOT[h.tone]}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{h.label}</p>
                      <p className="text-xs text-slate-400">{h.hint}</p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${TONE_TEXT[h.tone]}`}>{h.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* things to do */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-base font-bold text-slate-900">Things to do</h3>
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <CheckCircle2 className="h-9 w-9 text-emerald-500" />
                <p className="text-sm font-medium text-slate-700">You&apos;re all caught up</p>
                <p className="text-xs text-slate-400">No actions need your attention right now.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100">
                {tasks.map((t) => {
                  const Icon = t.icon;
                  return (
                    <div
                      key={t.text}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="text-sm font-medium text-slate-800">{t.text}</p>
                      </div>
                      <Link
                        href={t.href}
                        className="shrink-0 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        {t.cta}
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* what's new */}
        <section className="max-w-5xl">
          <div className="mb-4 flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-wm-blue" />
            <h2 className="text-xl font-bold text-slate-900">What&apos;s new in Seller Center</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {news.map((n) => {
              const Icon = n.icon;
              return (
                <div
                  key={n.title}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-wm-blue">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {n.tag}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{n.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{n.desc}</p>
                  </div>
                  <button
                    type="button"
                    className="mt-auto inline-flex items-center gap-1 self-start text-sm font-semibold text-wm-blue hover:underline"
                  >
                    Learn more <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <SideRailTabs />
    </div>
  );
}
