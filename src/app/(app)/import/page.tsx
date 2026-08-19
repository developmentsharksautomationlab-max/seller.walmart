"use client";

import Link from "next/link";
import { Package, Loader2 } from "lucide-react";
import { FormError } from "@/components/ui/fields";
import { useProtectedFetch } from "@/hooks/useProtectedFetch";
import ImportClient from "./import-client";
import OrderForm from "@/components/OrderForm";
import GenerateOrders from "@/components/GenerateOrders";
import type { CatalogRow } from "@/app/(app)/products/CatalogClient";

export default function ImportPage() {
  const { data: products, loading, error } = useProtectedFetch<CatalogRow[]>("/api/products");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <ImportClient />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {loading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : error || !products ? (
          <FormError message={error ?? "Something went wrong."} />
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <Package className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">
              Add a product before recording orders.
            </p>
            <Link
              href="/products"
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              <Package className="h-4 w-4" />
              Add a product
            </Link>
          </div>
        ) : (
          <OrderForm products={products} />
        )}

        <GenerateOrders />
      </div>
    </div>
  );
}
