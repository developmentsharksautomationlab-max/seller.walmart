"use client";

import { Loader2 } from "lucide-react";
import { FormError } from "@/components/ui/fields";
import { useProtectedFetch } from "@/hooks/useProtectedFetch";
import PerformanceCards, { type Metric } from "./PerformanceCards";

export default function PerformancePage() {
  const { data: metrics, loading, error } = useProtectedFetch<Metric[]>("/api/performance");

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Performance</h1>
      <p className="mb-8 mt-2 max-w-3xl text-sm text-slate-600">
        Your performance in key categories affects your seller score and can help
        you identify areas to improve. Learn more about{" "}
        <span className="font-semibold text-slate-900 underline underline-offset-2">
          seller performance standards.
        </span>
      </p>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : error || !metrics ? (
        <FormError message={error ?? "Something went wrong."} />
      ) : (
        <PerformanceCards metrics={metrics} />
      )}
    </div>
  );
}
