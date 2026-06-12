"use client";

import { useActionState, useState } from "react";
import { Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { generateOrders } from "@/app/actions/orders";
import {
  inputClass,
  labelClass,
  primaryBtnClass,
  errorTextClass,
} from "@/components/ui/styles";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function GenerateOrders() {
  const [state, action, pending] = useActionState(generateOrders, undefined);
  const [gmv, setGmv] = useState(5000);
  const [units, setUnits] = useState(60);
  const [orders, setOrders] = useState(25);
  const [from, setFrom] = useState(() => iso(new Date(Date.now() - 29 * 86_400_000)));
  const [to, setTo] = useState(() => iso(new Date()));

  // AUR is derived: GMV ÷ Units. Shown live so the targets stay consistent.
  const aur = units > 0 ? gmv / units : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-wm-blue" />
        <h2 className="text-sm font-semibold text-slate-900">
          Generate orders from targets
        </h2>
      </div>
      <p className="mb-4 mt-0.5 text-xs text-slate-500">
        Enter the totals you want — orders, customers, products and prices are
        filled in automatically to match, across the dates you choose.
      </p>

      <form action={action} className="flex flex-col gap-4">
        {state?.ok && (
          <p className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {state.ok}
          </p>
        )}
        {state?.error && (
          <p className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {state.error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="gmv" className={labelClass}>
              GMV ($)
            </label>
            <input
              id="gmv"
              name="gmv"
              type="number"
              min="1"
              step="0.01"
              value={gmv}
              onChange={(e) => setGmv(parseFloat(e.target.value) || 0)}
              className={inputClass}
              required
            />
            {state?.errors?.gmv && (
              <p className={errorTextClass}>{state.errors.gmv[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="units" className={labelClass}>
              Units Sold
            </label>
            <input
              id="units"
              name="units"
              type="number"
              min="1"
              step="1"
              value={units}
              onChange={(e) => setUnits(parseInt(e.target.value, 10) || 0)}
              className={inputClass}
              required
            />
            {state?.errors?.units && (
              <p className={errorTextClass}>{state.errors.units[0]}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="orders" className={labelClass}>
            Orders
          </label>
          <input
            id="orders"
            name="orders"
            type="number"
            min="1"
            step="1"
            value={orders}
            onChange={(e) => setOrders(parseInt(e.target.value, 10) || 0)}
            className={inputClass}
            required
          />
          {state?.errors?.orders && (
            <p className={errorTextClass}>{state.errors.orders[0]}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="from" className={labelClass}>
              From date
            </label>
            <input
              id="from"
              name="from"
              type="date"
              max={to}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={inputClass}
              required
            />
            {state?.errors?.from && (
              <p className={errorTextClass}>{state.errors.from[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="to" className={labelClass}>
              To date
            </label>
            <input
              id="to"
              name="to"
              type="date"
              min={from}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={inputClass}
              required
            />
            {state?.errors?.to && (
              <p className={errorTextClass}>{state.errors.to[0]}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
          <span className="text-sm text-slate-500">
            AUR <span className="text-xs text-slate-400">(auto)</span>
          </span>
          <span className="text-base font-semibold text-slate-900">
            {money.format(aur)}
          </span>
        </div>

        <button type="submit" disabled={pending} className={primaryBtnClass}>
          {pending ? "Generating…" : "Generate orders"}
        </button>
      </form>
    </div>
  );
}
