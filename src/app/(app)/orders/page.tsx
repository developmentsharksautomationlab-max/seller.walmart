"use client";

import { Loader2 } from "lucide-react";
import { FormError } from "@/components/ui/fields";
import { useProtectedFetch } from "@/hooks/useProtectedFetch";
import OrdersTable, { type OrderRow } from "./OrdersTable";

export default function OrdersPage() {
  const { data: orders, loading, error, refetch } = useProtectedFetch<OrderRow[]>("/api/orders");

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }
  if (error || !orders) {
    return <FormError message={error ?? "Something went wrong."} />;
  }

  return <OrdersTable orders={orders} onChanged={refetch} />;
}
