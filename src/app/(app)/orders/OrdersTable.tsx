"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Info,
  Search,
  SlidersHorizontal,
  Columns3,
  Upload,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  PackageX,
  Truck,
  CheckCheck,
} from "lucide-react";
import type { OrderStatus } from "@/lib/definitions";
import { apiFetch } from "@/lib/client-auth";
import OrderStatusSelect from "./OrderStatusSelect";
import ItemThumb from "@/components/ItemThumb";

export type OrderRow = {
  id: string;
  productName: string;
  category: string;
  customerName: string;
  quantity: number;
  amount: number;
  status: OrderStatus;
  createdAtIso: string;
};

// ---- deterministic synthetic fields (stable per order id) ------------------
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
function digitsFrom(seed: string, len: number): string {
  let x = hashStr(seed) || 1;
  let out = "";
  while (out.length < len) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0;
    out += (x % 10).toString();
  }
  return out.slice(0, len);
}
const poOf = (id: string) => "1" + digitsFrom(id + "po", 14);
const orderNoOf = (id: string) => "2000" + digitsFrom(id + "on", 11);

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});
function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(
    2,
    "0",
  )}/${d.getFullYear()}`;
}
function shipByOf(iso: string): string {
  return fmtDate(new Date(new Date(iso).getTime() + 2 * 86_400_000).toISOString());
}
type Decorated = OrderRow & { po: string; orderNo: string; shipBy: string };

const TABS = [
  { key: "unshipped", label: "Unshipped" },
  { key: "shipped", label: "Shipped" },
  { key: "canceled", label: "Canceled" },
  { key: "all", label: "All" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const SEARCH_FIELDS = [
  { key: "orderNo", label: "Order #" },
  { key: "po", label: "Purchase order #" },
  { key: "customer", label: "Customer" },
  { key: "item", label: "Item" },
] as const;
type SearchField = (typeof SEARCH_FIELDS)[number]["key"];

const OPTIONAL_COLS = [
  { key: "shipBy", label: "Ship by" },
  { key: "orderNo", label: "Order#" },
  { key: "orderTotal", label: "Order total" },
  { key: "item", label: "Item" },
  { key: "qty", label: "Qty" },
  { key: "shipFrom", label: "Ship from" },
] as const;
type ColKey = (typeof OPTIONAL_COLS)[number]["key"];

const th = "px-4 py-3 text-left text-xs font-semibold text-slate-500";
const td = "px-4 py-3.5 align-middle text-sm";
const outlineBtn =
  "inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50";

export default function OrdersTable({
  orders,
  onChanged,
}: {
  orders: OrderRow[];
  onChanged: () => void;
}) {
  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("orderNo");
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [colsOpen, setColsOpen] = useState(false);
  const [dlOpen, setDlOpen] = useState(false);
  const [cols, setCols] = useState<Record<ColKey, boolean>>({
    shipBy: true,
    orderNo: true,
    orderTotal: true,
    item: true,
    qty: true,
    shipFrom: true,
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();

  const decorated: Decorated[] = useMemo(
    () =>
      orders.map((o) => ({
        ...o,
        po: poOf(o.id),
        orderNo: orderNoOf(o.id),
        shipBy: shipByOf(o.createdAtIso),
      })),
    [orders],
  );

  const counts = useMemo(
    () => ({
      unshipped: orders.filter((o) => o.status === "Unshipped").length,
      shipped: orders.filter((o) => o.status === "Shipped" || o.status === "Delivered").length,
      canceled: orders.filter((o) => o.status === "Canceled").length,
      all: orders.length,
    }),
    [orders],
  );

  const rows = useMemo(() => {
    let list = decorated;
    if (tab === "unshipped") list = list.filter((r) => r.status === "Unshipped");
    else if (tab === "shipped")
      list = list.filter((r) => r.status === "Shipped" || r.status === "Delivered");
    else if (tab === "canceled") list = list.filter((r) => r.status === "Canceled");

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const v =
          searchField === "orderNo"
            ? r.orderNo
            : searchField === "po"
              ? r.po
              : searchField === "customer"
                ? r.customerName
                : r.productName;
        return v.toLowerCase().includes(q);
      });
    }
    const min = parseFloat(minTotal);
    const max = parseFloat(maxTotal);
    if (!isNaN(min)) list = list.filter((r) => r.amount >= min);
    if (!isNaN(max)) list = list.filter((r) => r.amount <= max);
    return list;
  }, [decorated, tab, query, searchField, minTotal, maxTotal]);

  const activeFilters = (minTotal ? 1 : 0) + (maxTotal ? 1 : 0);
  const visibleColCount = OPTIONAL_COLS.filter((c) => cols[c.key]).length;

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
  function toggleAll() {
    setSelected((prev) => {
      if (rows.every((r) => prev.has(r.id)) && rows.length > 0) {
        const next = new Set(prev);
        rows.forEach((r) => next.delete(r.id));
        return next;
      }
      const next = new Set(prev);
      rows.forEach((r) => next.add(r.id));
      return next;
    });
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function bulkStatus(status: OrderStatus) {
    const ids = [...selected];
    startTransition(async () => {
      await Promise.all(
        ids.map((id) =>
          apiFetch(`/api/orders/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
          }),
        ),
      );
      setSelected(new Set());
      onChanged();
    });
  }
  function bulkDelete() {
    const ids = [...selected];
    startTransition(async () => {
      await Promise.all(ids.map((id) => apiFetch(`/api/orders/${id}`, { method: "DELETE" })));
      setSelected(new Set());
      onChanged();
    });
  }
  function deleteOne(id: string) {
    startTransition(async () => {
      await apiFetch(`/api/orders/${id}`, { method: "DELETE" });
      onChanged();
    });
  }

  function downloadCsv() {
    setDlOpen(false);
    const head = [
      "Purchase order#",
      "Ship by",
      "Order#",
      "Order total",
      "Item",
      "Qty",
      "Ship from",
      "Status",
      "Customer",
    ];
    const lines = rows.map((r) =>
      [
        r.po,
        r.shipBy,
        r.orderNo,
        r.amount.toFixed(2),
        `"${r.productName.replace(/"/g, '""')}"`,
        r.quantity,
        "USA",
        r.status,
        `"${r.customerName.replace(/"/g, '""')}"`,
      ].join(","),
    );
    const csv = [head.join(","), ...lines].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-[80rem]">
      {/* header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900">
          Orders
          <Info className="h-4 w-4 text-slate-400" />
        </h1>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="text-sm font-semibold text-slate-700 underline underline-offset-2 hover:text-wm-blue"
          >
            Downloaded files
          </button>
          <div className="relative">
            <button type="button" onClick={() => setDlOpen((o) => !o)} className={outlineBtn}>
              <Download className="h-4 w-4" />
              Download Orders files
              <ChevronDown className="h-4 w-4" />
            </button>
            {dlOpen && (
              <>
                <button
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                  onClick={() => setDlOpen(false)}
                  className="fixed inset-0 z-30 cursor-default"
                />
                <div className="absolute right-0 z-40 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={downloadCsv}
                    className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Export current view (.csv)
                  </button>
                </div>
              </>
            )}
          </div>
          <Link
            href="/import"
            className="inline-flex items-center gap-2 rounded-lg bg-wm-blue px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-wm-blue-dark"
          >
            <Upload className="h-4 w-4" />
            Upload Orders file
          </Link>
        </div>
      </div>

      {/* card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* tabs */}
        <div className="flex gap-6 border-b border-slate-200 px-5">
          {TABS.map((t) => {
            const on = tab === t.key;
            const n = counts[t.key];
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`relative -mb-px py-3.5 text-sm font-semibold transition-colors ${
                  on ? "text-wm-blue" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.label} ({n})
                {on && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-wm-blue" />}
              </button>
            );
          })}
        </div>

        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative">
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value as SearchField)}
              className="h-10 cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white pl-3.5 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-wm-blue"
            >
              {SEARCH_FIELDS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative min-w-[16rem] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ex. 200013123915272"
              className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-wm-blue focus:ring-2 focus:ring-wm-blue/20"
            />
          </div>

          {/* Filters */}
          <div className="relative">
            <button type="button" onClick={() => setFiltersOpen((o) => !o)} className={`${outlineBtn} h-10`}>
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilters > 0 && (
                <span className="ml-0.5 rounded-full bg-wm-blue px-1.5 text-xs font-bold text-white">
                  {activeFilters}
                </span>
              )}
            </button>
            {filtersOpen && (
              <>
                <button
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                  onClick={() => setFiltersOpen(false)}
                  className="fixed inset-0 z-30 cursor-default"
                />
                <div className="absolute right-0 z-40 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
                  <p className="mb-2 text-sm font-semibold text-slate-900">Order total</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={minTotal}
                      onChange={(e) => setMinTotal(e.target.value)}
                      placeholder="Min"
                      className="h-9 w-full rounded-lg border border-slate-300 px-2.5 text-sm outline-none focus:border-wm-blue"
                    />
                    <span className="text-slate-400">–</span>
                    <input
                      type="number"
                      value={maxTotal}
                      onChange={(e) => setMaxTotal(e.target.value)}
                      placeholder="Max"
                      className="h-9 w-full rounded-lg border border-slate-300 px-2.5 text-sm outline-none focus:border-wm-blue"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMinTotal("");
                      setMaxTotal("");
                    }}
                    className="mt-3 text-sm font-semibold text-wm-blue hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Columns */}
          <div className="relative">
            <button type="button" onClick={() => setColsOpen((o) => !o)} className={`${outlineBtn} h-10`}>
              <Columns3 className="h-4 w-4" />
              Columns ({visibleColCount})
            </button>
            {colsOpen && (
              <>
                <button
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                  onClick={() => setColsOpen(false)}
                  className="fixed inset-0 z-30 cursor-default"
                />
                <div className="absolute right-0 z-40 mt-1 w-52 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                  {OPTIONAL_COLS.map((c) => (
                    <label
                      key={c.key}
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={cols[c.key]}
                        onChange={() => setCols((p) => ({ ...p, [c.key]: !p[c.key] }))}
                        className="h-4 w-4 rounded border-slate-300 accent-wm-blue"
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* bulk action bar */}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-y border-wm-blue/20 bg-wm-blue/5 px-4 py-2.5">
            <span className="text-sm font-semibold text-slate-700">{selected.size} selected</span>
            <button
              type="button"
              disabled={pending}
              onClick={() => bulkStatus("Shipped")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Truck className="h-4 w-4" />
              Mark Shipped
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => bulkStatus("Delivered")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4" />
              Mark Delivered
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => bulkStatus("Canceled")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <PackageX className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={bulkDelete}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        )}

        {/* table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allChecked}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-slate-300 accent-wm-blue"
                  />
                </th>
                <th className={th}>
                  <span className="inline-flex items-center gap-1">
                    Purchase order# <Info className="h-3.5 w-3.5 text-slate-400" />
                  </span>
                </th>
                {cols.shipBy && <th className={th}>Ship by</th>}
                {cols.orderNo && <th className={th}>Order#</th>}
                {cols.orderTotal && <th className={th}>Order total</th>}
                {cols.item && <th className={th}>Item</th>}
                {cols.qty && <th className={th}>Qty</th>}
                {cols.shipFrom && <th className={th}>Ship from</th>}
                <th className={th}>Status</th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-16 text-center text-sm text-slate-400">
                    No orders to show.
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        aria-label={`Select ${r.orderNo}`}
                        checked={selected.has(r.id)}
                        onChange={() => toggleOne(r.id)}
                        className="h-4 w-4 rounded border-slate-300 accent-wm-blue"
                      />
                    </td>
                    <td className={td}>
                      <button
                        type="button"
                        className="font-semibold text-wm-blue underline-offset-2 hover:underline"
                      >
                        {r.po}
                      </button>
                    </td>
                    {cols.shipBy && <td className={`${td} text-slate-600`}>{r.shipBy}</td>}
                    {cols.orderNo && <td className={`${td} text-slate-600`}>{r.orderNo}</td>}
                    {cols.orderTotal && (
                      <td className={`${td} font-medium text-slate-900`}>{usd.format(r.amount)}</td>
                    )}
                    {cols.item && (
                      <td className={td}>
                        <ItemThumb category={r.category} title={r.productName} size="sm" />
                      </td>
                    )}
                    {cols.qty && <td className={`${td} text-slate-700`}>{r.quantity}</td>}
                    {cols.shipFrom && <td className={`${td} text-slate-600`}>USA</td>}
                    <td className={td}>
                      <OrderStatusSelect id={r.id} status={r.status} onChanged={onChanged} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => deleteOne(r.id)}
                        title="Delete order"
                        className="inline-flex rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* pagination footer */}
        <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Items per page</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 cursor-pointer appearance-none rounded-md border border-slate-300 bg-white pl-2.5 pr-7 text-xs font-semibold text-slate-700 outline-none focus:border-wm-blue"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <span className="font-medium text-slate-700">
            {rows.length === 0
              ? "0 of 0"
              : `${(safePage - 1) * pageSize + 1}-${Math.min(safePage * pageSize, rows.length)} of ${rows.length}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage(Math.max(1, safePage - 1))}
              aria-label="Previous page"
              className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage(Math.min(totalPages, safePage + 1))}
              aria-label="Next page"
              className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
