import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import PaymentsClient, { type Period } from "./PaymentsClient";

// Marketplace facilitator tax rate + referral (commission) rate used to derive
// the payout breakdown from each order's product price.
const TAX_RATE = 0.0725;
const COMMISSION_RATE = 0.15;
const REFUND_STATUSES = new Set(["Canceled", "Refunded"]);
const round2 = (n: number) => Math.round(n * 100) / 100;

// Payouts happen on Tuesdays — find the next one on/after the given date.
function nextTuesday(from: Date): Date {
  const d = new Date(from);
  let add = (2 - d.getDay() + 7) % 7;
  if (add === 0) add = 7;
  d.setDate(d.getDate() + add);
  return d;
}
const fmtDay = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtFull = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function PaymentsPage() {
  const { userId } = await verifySession();
  const orders = await prisma.order.findMany({
    where: { userId },
    select: { amount: true, status: true, createdAt: true },
  });

  const now = new Date();
  const periods: Period[] = [];

  // Six bi-weekly (14-day) statement periods, newest first; the first is "Open".
  for (let i = 0; i < 6; i++) {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    end.setDate(end.getDate() - i * 14);
    const start = new Date(end);
    start.setDate(start.getDate() - 13);
    start.setHours(0, 0, 0, 0);

    const inP = orders.filter((o) => o.createdAt >= start && o.createdAt <= end);
    const sold = inP.filter((o) => !REFUND_STATUSES.has(o.status));
    const refunded = inP.filter((o) => REFUND_STATUSES.has(o.status));

    const productPrice = round2(sold.reduce((s, o) => s + o.amount, 0));
    const shipping = 0;
    const taxCollected = round2(productPrice * TAX_RATE);
    const commission = round2(productPrice * COMMISSION_RATE);
    const taxWithheld = taxCollected;
    const savings = 0;
    const salesTotal = round2(
      productPrice + shipping + taxCollected - commission - taxWithheld + savings,
    );

    const refundedProduct = round2(refunded.reduce((s, o) => s + o.amount, 0));
    const refundCommission = round2(refundedProduct * COMMISSION_RATE);
    const refundsTotal = round2(-refundedProduct + refundCommission);

    const openingBalance = 0;
    const reserves = 0;
    const holds = 0;
    const accountBalance = round2(
      openingBalance + salesTotal + refundsTotal - reserves - holds,
    );

    const isOpen = i === 0;
    periods.push({
      label: `${fmtDay(start)} - ${fmtDay(end)}, ${end.getFullYear()}`,
      isOpen,
      accountBalance,
      openingBalance,
      reserves,
      holds,
      productPrice,
      shipping,
      taxCollected,
      commission,
      taxWithheld,
      savings,
      salesTotal,
      refundedProduct,
      refundCommission,
      refundsTotal,
      payoutDate: `${fmtFull(nextTuesday(isOpen ? now : end))} PDT`,
      status: isOpen ? "To Be Paid" : "Paid",
    });
  }

  return <PaymentsClient periods={periods} />;
}
