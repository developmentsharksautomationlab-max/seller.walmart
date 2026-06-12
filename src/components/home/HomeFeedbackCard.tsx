"use client";

import { useState } from "react";
import { MessagesSquare } from "lucide-react";

export default function HomeFeedbackCard() {
  const [show, setShow] = useState(true);
  if (!show) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-wm-blue">
          <MessagesSquare className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">
            Help us improve Seller Center
          </p>
          <p className="text-xs text-slate-500">
            Answer 2 quick questions about Homepage
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setShow(false)}
          className="text-sm font-medium text-slate-600 underline underline-offset-2 hover:text-slate-900"
        >
          Not right now
        </button>
        <button
          type="button"
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Give feedback
        </button>
      </div>
    </div>
  );
}
