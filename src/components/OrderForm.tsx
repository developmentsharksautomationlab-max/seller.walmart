"use client";

import { useActionState, useState } from "react";
import { createOrder } from "@/app/actions/orders";
import { ORDER_STATUSES } from "@/lib/definitions";
import {
  inputClass,
  labelClass,
  primaryBtnClass,
  errorTextClass,
} from "@/components/ui/styles";

type ProductOption = { id: string; name: string; price: number };

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export default function OrderForm({ products }: { products: ProductOption[] }) {
  const [state, action, pending] = useActionState(createOrder, undefined);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);

  const selected = products.find((p) => p.id === productId);
  const total = selected ? selected.price * (quantity || 0) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Record an order</h2>
      <p className="mb-4 text-xs text-slate-500">
        The amount is calculated from the product price.
      </p>

      <form action={action} className="flex flex-col gap-4">
        {state?.message && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {state.message}
          </p>
        )}

        <div>
          <label htmlFor="productId" className={labelClass}>
            Product
          </label>
          <select
            id="productId"
            name="productId"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className={inputClass}
            required
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {money.format(p.price)}
              </option>
            ))}
          </select>
          {state?.errors?.productId && (
            <p className={errorTextClass}>{state.errors.productId[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="customerName" className={labelClass}>
            Customer name
          </label>
          <input
            id="customerName"
            name="customerName"
            type="text"
            placeholder="e.g. Aarav Sharma"
            className={inputClass}
            required
          />
          {state?.errors?.customerName && (
            <p className={errorTextClass}>{state.errors.customerName[0]}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="quantity" className={labelClass}>
              Quantity
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
              className={inputClass}
              required
            />
            {state?.errors?.quantity && (
              <p className={errorTextClass}>{state.errors.quantity[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="status" className={labelClass}>
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue="Unshipped"
              className={inputClass}
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {state?.errors?.status && (
              <p className={errorTextClass}>{state.errors.status[0]}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
          <span className="text-sm text-slate-500">Order total</span>
          <span className="text-base font-semibold text-slate-900">
            {money.format(total)}
          </span>
        </div>

        <button type="submit" disabled={pending} className={primaryBtnClass}>
          {pending ? "Saving…" : "Add order"}
        </button>
      </form>
    </div>
  );
}
