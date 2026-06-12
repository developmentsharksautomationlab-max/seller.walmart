"use client";

import { useEffect, useState } from "react";
import {
  Info,
  ChevronDown,
  Circle,
  CircleDollarSign,
  X,
  RotateCcw,
} from "lucide-react";
import { inputClass, labelClass } from "@/components/ui/styles";

export type Period = {
  label: string;
  isOpen: boolean;
  accountBalance: number;
  openingBalance: number;
  reserves: number;
  holds: number;
  productPrice: number;
  shipping: number;
  taxCollected: number;
  commission: number; // positive magnitude
  taxWithheld: number; // positive magnitude
  savings: number;
  salesTotal: number;
  refundedProduct: number; // positive magnitude
  refundCommission: number; // positive magnitude
  refundsTotal: number; // signed
  payoutDate: string;
  status: string;
};

// The signed values exactly as shown on the page (deductions are negative).
type Vals = {
  accountBalance: number;
  openingBalance: number;
  reserves: number;
  holds: number;
  productPrice: number;
  shipping: number;
  taxCollected: number;
  netCommission: number;
  netTaxWithheld: number;
  savings: number;
  salesTotal: number;
  refundedProduct: number;
  refundCommission: number;
  refundsTotal: number;
};
type ValKey = keyof Vals;
type Override = Partial<Vals> & { status?: string; payoutDate?: string };
type Draft = Record<ValKey, string> & { status: string; payoutDate: string };

const AMOUNT_FIELDS: { key: ValKey; label: string }[] = [
  { key: "accountBalance", label: "Account balance" },
  { key: "openingBalance", label: "Opening balance" },
  { key: "reserves", label: "Reserves" },
  { key: "holds", label: "Holds" },
  { key: "productPrice", label: "Product price" },
  { key: "shipping", label: "Shipping" },
  { key: "taxCollected", label: "Net tax collected" },
  { key: "netCommission", label: "Net commission" },
  { key: "netTaxWithheld", label: "Net tax withheld" },
  { key: "savings", label: "Total Walmart funded savings" },
  { key: "salesTotal", label: "Sales total" },
  { key: "refundedProduct", label: "Refunded product price" },
  { key: "refundCommission", label: "Refund commission" },
  { key: "refundsTotal", label: "Refunds total" },
];

const STORE_KEY = "payments-overrides-v1";

function valsOf(p: Period): Vals {
  return {
    accountBalance: p.accountBalance,
    openingBalance: p.openingBalance,
    reserves: p.reserves,
    holds: p.holds,
    productPrice: p.productPrice,
    shipping: p.shipping,
    taxCollected: p.taxCollected,
    netCommission: -p.commission,
    netTaxWithheld: -p.taxWithheld,
    savings: p.savings,
    salesTotal: p.salesTotal,
    refundedProduct: -p.refundedProduct,
    refundCommission: p.refundCommission,
    refundsTotal: p.refundsTotal,
  };
}

function money(n: number): string {
  const v = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${n < -0.005 ? "−" : ""}$ ${v}`;
}

function Row({
  label,
  value,
  info = false,
}: {
  label: string;
  value: number;
  info?: boolean;
}) {
  const zero = Math.abs(value) < 0.005;
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="flex items-center gap-1.5 text-sm text-slate-700">
        {label}
        {info && <Info className="h-3.5 w-3.5 text-slate-400" />}
      </span>
      <span className={`text-sm ${zero ? "text-slate-500" : "text-wm-blue"}`}>
        {money(value)}
      </span>
    </div>
  );
}

function TotalRow({ value }: { value: number }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm font-bold text-slate-900">Total:</span>
      <span className="text-sm font-bold text-slate-900">{money(value)}</span>
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-medium text-slate-900">{children}</span>
    </div>
  );
}

export default function PaymentsClient({ periods }: { periods: Period[] }) {
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);

  // Load saved overrides after mount (keeps SSR markup stable, then applies the
  // persisted edits) so manual changes survive reloads.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydrate from localStorage
      if (raw) setOverrides(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
  }, []);

  function persist(next: Record<string, Override>) {
    setOverrides(next);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota / unavailable storage
    }
  }

  const p = periods[idx];
  const ov = overrides[p.label] ?? {};
  const eff = valsOf(p);
  for (const f of AMOUNT_FIELDS) {
    const v = ov[f.key];
    if (typeof v === "number") eff[f.key] = v;
  }
  const effStatus = ov.status ?? p.status;
  const effPayoutDate = ov.payoutDate ?? p.payoutDate;
  const edited = Object.keys(ov).length > 0;

  function openEdit() {
    const amounts = Object.fromEntries(
      AMOUNT_FIELDS.map((f) => [f.key, String(eff[f.key])]),
    ) as Record<ValKey, string>;
    setDraft({ ...amounts, status: effStatus, payoutDate: effPayoutDate });
    setEditOpen(true);
  }

  function save() {
    if (!draft) return;
    const next: Override = { status: draft.status, payoutDate: draft.payoutDate };
    for (const f of AMOUNT_FIELDS) {
      const n = parseFloat(draft[f.key]);
      next[f.key] = Number.isFinite(n) ? n : 0;
    }
    persist({ ...overrides, [p.label]: next });
    setEditOpen(false);
  }

  function reset() {
    const next = { ...overrides };
    delete next[p.label];
    persist(next);
    setEditOpen(false);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* left column */}
        <div className="flex flex-1 flex-col gap-6">
          {/* period + account balance */}
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-800 underline underline-offset-2 hover:text-wm-blue"
              >
                {p.label}
                {p.isOpen ? " (Open)" : ""}
                <ChevronDown className="h-4 w-4" />
              </button>
              {open && (
                <>
                  <button
                    type="button"
                    aria-hidden
                    tabIndex={-1}
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 z-30 cursor-default"
                  />
                  <div className="absolute left-0 z-40 mt-2 w-64 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                    {periods.map((per, i) => (
                      <button
                        key={per.label}
                        type="button"
                        onClick={() => {
                          setIdx(i);
                          setOpen(false);
                        }}
                        className={`block w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${
                          i === idx ? "font-semibold text-wm-blue" : "text-slate-700"
                        }`}
                      >
                        {per.label}
                        {per.isOpen ? " (Open)" : ""}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="border-l border-slate-200 pl-10">
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                Account balance{" "}
                {/* secret trigger: single-click this ⓘ icon to open the editor */}
                <button
                  type="button"
                  onClick={openEdit}
                  aria-label="Account balance details"
                  className="inline-flex"
                >
                  <Info className="h-3.5 w-3.5 text-slate-400" />
                </button>
              </p>
              {/* secret trigger 2: double-click this number to open the editor */}
              <p
                onDoubleClick={openEdit}
                className="mt-0.5 select-none text-2xl font-bold text-slate-900"
              >
                {money(eff.accountBalance)}
              </p>
            </div>
          </div>

          {/* breakdown */}
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
            <div className="divide-y divide-slate-100">
              <div className="py-1">
                <Row label="Opening balance" value={eff.openingBalance} info />
                <Row label="Reserves" value={eff.reserves} info />
                <Row label="Holds" value={eff.holds} info />
              </div>

              <div className="py-1">
                <h3 className="pb-1 pt-3 text-base font-bold text-slate-900">Sales</h3>
                <Row label="Product price" value={eff.productPrice} />
                <Row label="Shipping" value={eff.shipping} />
                <Row label="Net tax collected" value={eff.taxCollected} />
                <Row label="Net commission" value={eff.netCommission} />
                <Row label="Net tax withheld" value={eff.netTaxWithheld} />
                <Row label="Total Walmart funded savings" value={eff.savings} info />
                <TotalRow value={eff.salesTotal} />
              </div>

              <div className="py-1">
                <h3 className="pb-1 pt-3 text-base font-bold text-slate-900">Refunds</h3>
                <Row label="Refunded product price" value={eff.refundedProduct} />
                <Row label="Refund commission" value={eff.refundCommission} />
                <TotalRow value={eff.refundsTotal} />
              </div>
            </div>
          </div>
        </div>

        {/* right column: payout details */}
        <div className="w-full shrink-0 lg:w-80">
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <h2 className="mb-2 text-base font-bold text-slate-900">Payout Details</h2>
            <div className="divide-y divide-slate-100">
              <Detail label="Status">
                <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-wm-blue">
                  {effStatus}
                </span>
              </Detail>
              <Detail label="Payout date">{effPayoutDate}</Detail>
              <Detail label="Payout cycle">Bi-weekly</Detail>
              <Detail label="Payout method">
                <span className="inline-flex items-center gap-1.5">
                  <Circle className="h-4 w-4 fill-orange-400 text-orange-400" />
                  Payoneer
                </span>
              </Detail>
              <Detail label="Billing method">
                <span className="inline-flex items-center gap-1.5">
                  <CircleDollarSign className="h-4 w-4 text-slate-500" />
                  ACH
                </span>
              </Detail>
            </div>
            <p className="mt-4 text-xs italic leading-relaxed text-slate-400">
              *Payouts take place on Tuesdays. But it may take several business days
              for the funds to appear in your account.
            </p>
          </div>
        </div>
      </div>

      {/* edit modal */}
      {editOpen && draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setEditOpen(false)}
            className="absolute inset-0 cursor-default bg-slate-900/40"
          />
          <div className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Edit figures</h2>
                <p className="text-xs text-slate-500">
                  Manually override any number for {p.label}
                  {p.isOpen ? " (Open)" : ""}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Amounts (USD)
              </h3>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                {AMOUNT_FIELDS.map((f) => (
                  <div key={f.key}>
                    <label htmlFor={f.key} className={labelClass}>
                      {f.label}
                    </label>
                    <input
                      id={f.key}
                      type="number"
                      step="0.01"
                      value={draft[f.key]}
                      onChange={(e) =>
                        setDraft({ ...draft, [f.key]: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>

              <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Payout details
              </h3>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="status" className={labelClass}>
                    Status
                  </label>
                  <input
                    id="status"
                    type="text"
                    value={draft.status}
                    onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="payoutDate" className={labelClass}>
                    Payout date
                  </label>
                  <input
                    id="payoutDate"
                    type="text"
                    value={draft.payoutDate}
                    onChange={(e) =>
                      setDraft({ ...draft, payoutDate: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Tip: deductions like commission show with a minus — enter a negative
                value (e.g. −63.84) to display them in red as on Walmart.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={reset}
                disabled={!edited}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to calculated
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  className="rounded-full bg-wm-blue px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-wm-blue-dark"
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
