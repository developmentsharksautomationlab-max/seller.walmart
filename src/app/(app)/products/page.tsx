"use client";

import { Loader2 } from "lucide-react";
import { FormError } from "@/components/ui/fields";
import { useProtectedFetch } from "@/hooks/useProtectedFetch";
import { STARTER_CATALOG } from "@/lib/starter-catalog";
import CatalogClient, { type CatalogRow } from "./CatalogClient";

// Display-only placeholder rows for accounts with an empty catalog (e.g. on
// an environment that hasn't been seeded) — nothing is written to the db.
const FAKE_ROWS: CatalogRow[] = STARTER_CATALOG.map((item, i) => ({
  id: `fake-${i}`,
  name: item.name,
  category: item.category,
  price: item.price,
  stock: item.stock,
  imageUrl: item.imageUrl,
  createdAtIso: new Date().toISOString(),
}));

export default function CatalogPage() {
  const { data: products, loading, error, refetch } =
    useProtectedFetch<CatalogRow[]>("/api/products");

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }
  if (error || !products) {
    return <FormError message={error ?? "Something went wrong."} />;
  }

  const rows = products.length > 0 ? products : FAKE_ROWS;

  return <CatalogClient products={rows} onChanged={refetch} />;
}
