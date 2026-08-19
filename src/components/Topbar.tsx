"use client";

import { useState } from "react";
import {
  LayoutGrid,
  Search,
  Bell,
  HelpCircle,
  Settings,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export default function Topbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const userName = user?.name ?? "";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
      {/* brand */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open app launcher"
          className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <LayoutGrid className="h-5 w-5" />
        </button>
        <span className="text-lg font-bold tracking-tight text-wm-blue">
          Seller Center
        </span>
      </div>

      {/* search */}
      <div className="relative mx-auto hidden w-full max-w-xl md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Try searching for Reports"
          className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-wm-blue focus:ring-2 focus:ring-wm-blue/20"
        />
      </div>

      {/* actions */}
      <div className="ml-auto flex items-center gap-1 md:ml-0">
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
            22
          </span>
        </button>
        <button
          type="button"
          aria-label="Help"
          className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Settings"
          className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <Settings className="h-5 w-5" />
        </button>

        {/* avatar + dropdown */}
        <div className="relative ml-1">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 py-1 pl-1 pr-2 transition-colors hover:bg-slate-50"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-wm-blue text-xs font-semibold text-white">
              {initials(userName)}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </button>

          {menuOpen && (
            <>
              <button
                type="button"
                aria-hidden
                tabIndex={-1}
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{userName}</p>
                  <p className="text-xs text-slate-500">Seller account</p>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
