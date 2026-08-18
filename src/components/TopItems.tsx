"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package } from "lucide-react";
import type { TopItem } from "@/lib/queries";
import { prefixFromPathname } from "@/lib/acct";

export default function TopItems({ items }: { items: TopItem[] }) {
  const prefix = prefixFromPathname(usePathname());
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 p-5">
        <div>
          <h2 className="text-sm font-bold text-wm-navy">Top items</h2>
          <p className="text-xs text-slate-500">Best sellers by GMV</p>
        </div>
        <Link
          href={`${prefix}/products`}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          View all items
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-10 text-center">
          <Package className="h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-400">No sales in this period.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">#</th>
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="px-5 py-3 font-medium">Units</th>
                <th className="px-5 py-3 font-medium">Orders</th>
                <th className="px-5 py-3 text-right font-medium">GMV</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr
                  key={it.name}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-5 py-3.5 font-semibold text-slate-400">{i + 1}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-900">{it.name}</td>
                  <td className="px-5 py-3.5 text-slate-600">{it.units}</td>
                  <td className="px-5 py-3.5 text-slate-600">{it.orders}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-wm-navy">
                    {it.gmv}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
