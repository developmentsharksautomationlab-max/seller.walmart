"use client";

import { Loader2 } from "lucide-react";
import { FormError } from "@/components/ui/fields";
import { useProtectedFetch } from "@/hooks/useProtectedFetch";
import CatalogClient, { type CatalogRow } from "./CatalogClient";

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

  return <CatalogClient products={products} onChanged={refetch} />;
}
