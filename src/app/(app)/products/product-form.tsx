"use client";

import { useState, useTransition } from "react";
import { apiFetch } from "@/lib/client-auth";
import type { FormState } from "@/lib/definitions";
import {
  inputClass,
  labelClass,
  primaryBtnClass,
  errorTextClass,
} from "@/components/ui/styles";

export default function ProductForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, setState] = useState<FormState>(undefined);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await apiFetch("/api/products", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(fd)),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setState(body ?? { message: "Something went wrong. Please try again." });
        return;
      }
      setState({ success: true });
      onSuccess?.();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {state?.message && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {state.message}
          </p>
        )}

        <div>
          <label htmlFor="name" className={labelClass}>
            Product name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="e.g. Wireless Headphones"
            className={inputClass}
            required
          />
          {state?.errors?.name && (
            <p className={errorTextClass}>{state.errors.name[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="category" className={labelClass}>
            Category
          </label>
          <input
            id="category"
            name="category"
            type="text"
            placeholder="e.g. Electronics"
            list="category-suggestions"
            className={inputClass}
            required
          />
          <datalist id="category-suggestions">
            <option value="Electronics" />
            <option value="Apparel" />
            <option value="Home & Living" />
            <option value="Beauty" />
            <option value="Sports" />
          </datalist>
          {state?.errors?.category && (
            <p className={errorTextClass}>{state.errors.category[0]}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="price" className={labelClass}>
              Price ($)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className={inputClass}
              required
            />
            {state?.errors?.price && (
              <p className={errorTextClass}>{state.errors.price[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="stock" className={labelClass}>
              Stock
            </label>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              defaultValue={0}
              className={inputClass}
              required
            />
            {state?.errors?.stock && (
              <p className={errorTextClass}>{state.errors.stock[0]}</p>
            )}
          </div>
        </div>

        <button type="submit" disabled={pending} className={primaryBtnClass}>
          {pending ? "Saving…" : "Add product"}
        </button>
    </form>
  );
}
