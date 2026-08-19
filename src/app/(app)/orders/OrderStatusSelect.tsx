"use client";

import { useOptimistic, useTransition } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/client-auth";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/definitions";

const styles: Record<OrderStatus, string> = {
  Unshipped: "bg-amber-50 text-amber-700 border-amber-200",
  Shipped: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Delivered: "bg-green-100 text-green-800 border-green-300",
  Canceled: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function OrderStatusSelect({
  id,
  status,
  onChanged,
}: {
  id: string;
  status: OrderStatus;
  onChanged: () => void;
}) {
  // `status` is the server truth. The optimistic value shows the user's pick
  // immediately and then resyncs to the freshly revalidated `status` once the
  // transition (fetch + refresh) settles — so the dropdown never snaps back.
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status);
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as OrderStatus;
    if (next === optimisticStatus) return;
    startTransition(async () => {
      setOptimisticStatus(next);
      await apiFetch(`/api/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      onChanged();
    });
  }

  return (
    <div className="relative inline-block">
      <select
        name="status"
        value={optimisticStatus}
        disabled={pending}
        aria-label="Update order status"
        onChange={handleChange}
        className={`cursor-pointer appearance-none rounded-md border py-1 pl-2.5 pr-7 text-xs font-semibold outline-none transition focus:ring-2 focus:ring-wm-blue/20 disabled:cursor-wait ${styles[optimisticStatus]} ${pending ? "opacity-70" : ""}`}
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s} className="bg-white text-slate-700">
            {s}
          </option>
        ))}
      </select>
      {pending ? (
        <Loader2 className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin opacity-70" />
      ) : (
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-70" />
      )}
    </div>
  );
}
