"use client";

import { Loader2 } from "lucide-react";
import { FormError } from "@/components/ui/fields";
import { useProtectedFetch } from "@/hooks/useProtectedFetch";
import PaymentsClient, { type Period } from "./PaymentsClient";

export default function PaymentsPage() {
  const { data: periods, loading, error } = useProtectedFetch<Period[]>("/api/payments");

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }
  if (error || !periods) {
    return <FormError message={error ?? "Something went wrong."} />;
  }

  return <PaymentsClient periods={periods} />;
}
