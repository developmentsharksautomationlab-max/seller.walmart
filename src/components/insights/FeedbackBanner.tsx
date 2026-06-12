"use client";

import { useState } from "react";
import { MessageSquareText } from "lucide-react";

export default function FeedbackBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl bg-blue-50 px-5 py-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-wm-blue shadow-sm">
        <MessageSquareText className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900">
          Help us improve Seller Center
        </p>
        <p className="text-sm text-slate-500">
          Answer 2 quick questions about Account Sales Report
        </p>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-sm font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900"
        >
          Not right now
        </button>
        <button
          type="button"
          className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-50"
        >
          Give feedback
        </button>
      </div>
    </div>
  );
}
