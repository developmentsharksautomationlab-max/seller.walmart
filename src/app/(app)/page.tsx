"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Tag, ShoppingCart, UploadCloud, Loader2 } from "lucide-react";
import SalesInsights from "@/components/insights/SalesInsights";
import SideRailTabs from "@/components/insights/SideRailTabs";
import { FormError } from "@/components/ui/fields";
import { useProtectedFetch } from "@/hooks/useProtectedFetch";
import type { DashboardData } from "@/lib/queries";

type DashboardResponse = {
  data: DashboardData;
  pickerDefaults: {
    start: string;
    end: string;
    compareOn: boolean;
    cStart: string;
    cEnd: string;
  };
  activeRange?: number;
};

function DashboardContent() {
  const searchParams = useSearchParams();
  const { data: res, loading, error } = useProtectedFetch<DashboardResponse>(
    `/api/dashboard?${searchParams.toString()}`,
  );

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }
  if (error || !res) {
    return <FormError message={error ?? "Something went wrong."} />;
  }

  const { data, pickerDefaults, activeRange } = res;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      {!data.hasData && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h2 className="text-sm font-bold text-wm-navy">
            Welcome to Seller Center 👋
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            You have no sales yet. Add an item, record an order, or bulk-import a
            file — your sales insights below will populate automatically.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-lg bg-wm-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-wm-blue-dark"
            >
              <Tag className="h-4 w-4" />
              Add an item
            </Link>
            <Link
              href="/import"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-wm-blue transition-colors hover:bg-slate-50"
            >
              <ShoppingCart className="h-4 w-4" />
              Record an order
            </Link>
            <Link
              href="/import"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-wm-blue transition-colors hover:bg-slate-50"
            >
              <UploadCloud className="h-4 w-4" />
              Import data
            </Link>
          </div>
        </div>
      )}

      <SalesInsights
        data={data}
        pickerDefaults={pickerDefaults}
        activeRange={activeRange}
      />
      <SideRailTabs />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
