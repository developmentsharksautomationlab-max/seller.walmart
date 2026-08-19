"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Info,
  ChevronDown,
  Sparkles,
  Download,
  CloudDownload,
  MoreHorizontal,
  Trash2,
  Search,
  Star,
  SlidersHorizontal,
  ArrowUpDown,
  Columns3,
  Pencil,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/client-auth";
import { inputClass, labelClass } from "@/components/ui/styles";
import ItemThumb from "@/components/ItemThumb";

export type CatalogRow = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  createdAtIso: string;
};

// ---- deterministic SKU (stable per product id) ----------------------------
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
const SKU_PREFIX = ["PG", "WM", "XN", "BR", "NEW"];
function skuOf(id: string): string {
  const prefix = SKU_PREFIX[hashStr(id) % SKU_PREFIX.length];
  return `${prefix}-${digitsFrom(id + "a", 7)}-${digitsFrom(id + "b", 12)}`;
}

type Status = "Published" | "Unpublished";
const statusOf = (stock: number): Status => (stock > 0 ? "Published" : "Unpublished");

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const TABS = [
  { key: "all", label: "All" },
  { key: "unpublished", label: "Unpublished" },
  { key: "errors", label: "Errors" },
  { key: "drafts", label: "Drafts" },
  { key: "published", label: "Published" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

type SortKey = "name" | "price" | "stock";
type Sort = { key: SortKey; dir: "asc" | "desc" };
const SORT_OPTIONS: { label: string; value: Sort }[] = [
  { label: "Item name (A–Z)", value: { key: "name", dir: "asc" } },
  { label: "Item name (Z–A)", value: { key: "name", dir: "desc" } },
  { label: "Price (low to high)", value: { key: "price", dir: "asc" } },
  { label: "Price (high to low)", value: { key: "price", dir: "desc" } },
  { label: "Inventory (high to low)", value: { key: "stock", dir: "desc" } },
];

type ColKey = "sku" | "status" | "price" | "bprice" | "bstrategy" | "inventory";
const COLUMNS: { key: ColKey; label: string }[] = [
  { key: "sku", label: "SKU" },
  { key: "status", label: "Status" },
  { key: "price", label: "Current Price (USD)" },
  { key: "bprice", label: "Business price" },
  { key: "bstrategy", label: "Business strategy" },
  { key: "inventory", label: "Inventory" },
];

type Decorated = CatalogRow & { sku: string; status: Status };

const PILL =
  "inline-flex h-10 items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50";
const th = "px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap";
const td = "px-4 py-3.5 align-middle text-sm";

export default function CatalogClient({
  products,
  onChanged,
}: {
  products: CatalogRow[];
  onChanged: () => void;
}) {
  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [searchField, setSearchField] = useState<"sku" | "name">("sku");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editItem, setEditItem] = useState<Decorated | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [sort, setSort] = useState<Sort | null>(null);
  const [favorites, setFavorites] = useState(false);
  const [cols, setCols] = useState<Record<ColKey, boolean>>({
    sku: true,
    status: true,
    price: true,
    bprice: true,
    bstrategy: true,
    inventory: true,
  });
  const [tool, setTool] = useState<string | null>(null); // which menu is open
  const [pending, startTransition] = useTransition();

  const decorated: Decorated[] = useMemo(
    () =>
      products.map((p) => ({ ...p, sku: skuOf(p.id), status: statusOf(p.stock) })),
    [products],
  );

  const counts = useMemo(
    () => ({
      all: decorated.length,
      unpublished: decorated.filter((p) => p.status === "Unpublished").length,
      errors: 0,
      drafts: 0,
      published: decorated.filter((p) => p.status === "Published").length,
    }),
    [decorated],
  );

  const rows = useMemo(() => {
    let list = decorated;
    if (tab === "unpublished") list = list.filter((p) => p.status === "Unpublished");
    else if (tab === "published") list = list.filter((p) => p.status === "Published");
    else if (tab === "errors" || tab === "drafts") list = [];

    const q = query.trim().toLowerCase();
    if (q)
      list = list.filter((p) =>
        (searchField === "sku" ? p.sku : p.name).toLowerCase().includes(q),
      );

    if (sort) {
      list = [...list].sort((a, b) => {
        const cmp =
          sort.key === "name"
            ? a.name.localeCompare(b.name)
            : sort.key === "price"
              ? a.price - b.price
              : a.stock - b.stock;
        return sort.dir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [decorated, tab, query, searchField, sort]);

  const selectedRows = decorated.filter((p) => selected.has(p.id));
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const visibleColCount = 2 + COLUMNS.filter((c) => cols[c.key]).length;
  const totalCols = 1 + visibleColCount; // + checkbox

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (rows.length > 0 && rows.every((r) => prev.has(r.id)))
        rows.forEach((r) => next.delete(r.id));
      else rows.forEach((r) => next.add(r.id));
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

  function bulkDelete() {
    const ids = [...selected];
    startTransition(async () => {
      await Promise.all(
        ids.map((id) => apiFetch(`/api/products/${id}`, { method: "DELETE" })),
      );
      setSelected(new Set());
      onChanged();
    });
  }

  function deleteOne(id: string) {
    startTransition(async () => {
      await apiFetch(`/api/products/${id}`, { method: "DELETE" });
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      onChanged();
    });
  }

  function downloadCsv(items: Decorated[]) {
    setTool(null);
    const head = [
      "Item Name",
      "SKU",
      "Status",
      "Current Price (USD)",
      "Business price",
      "Business strategy",
      "Inventory",
    ];
    const lines = items.map((r) =>
      [
        `"${r.name.replace(/"/g, '""')}"`,
        r.sku,
        r.status,
        r.price.toFixed(2),
        "Not eligible",
        "Not eligible",
        r.stock,
      ].join(","),
    );
    const csv = [head.join(","), ...lines].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "catalog.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-[80rem]">
      {/* card with tabs + table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* tabs */}
        <div className="flex gap-6 overflow-x-auto border-b border-slate-200 px-5">
          {TABS.map((t) => {
            const on = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`relative -mb-px whitespace-nowrap py-3.5 text-sm font-semibold transition-colors ${
                  on ? "text-wm-blue" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.label}
                {t.key !== "all" && ` (${counts[t.key].toLocaleString()})`}
                {on && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-wm-blue" />
                )}
              </button>
            );
          })}
        </div>

        {/* dark bulk bar when items are selected */}
        {selected.size > 0 ? (
          <div className="flex flex-wrap items-center gap-3 bg-slate-800 px-4 py-2.5 text-white">
            <span className="text-sm font-semibold">{selected.size} selected</span>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-sm font-medium text-slate-300 underline-offset-2 hover:text-white hover:underline"
            >
              Clear
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBulkEditOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100"
              >
                <Pencil className="h-4 w-4" />
                Edit items
              </button>
              <button
                type="button"
                title="GenAI enhancement isn't available in this demo"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100"
              >
                <Sparkles className="h-4 w-4 text-wm-blue" />
                Enhance with GenAI
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTool(tool === "download" ? null : "download")}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100"
                >
                  <Download className="h-4 w-4" />
                  Download spreadsheet
                  <ChevronDown className="h-4 w-4" />
                </button>
                {tool === "download" && (
                  <>
                    <Overlay onClose={() => setTool(null)} />
                    <div className="absolute right-0 z-40 mt-1 w-52 rounded-lg border border-slate-200 bg-white py-1 text-slate-700 shadow-lg">
                      <button
                        type="button"
                        onClick={() => downloadCsv(selectedRows)}
                        className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        Selected items ({selectedRows.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadCsv(decorated)}
                        className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        All items ({decorated.length})
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={bulkDelete}
                title="Delete selected"
                className="inline-flex items-center justify-center rounded-full bg-white p-2 text-slate-800 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          /* rich toolbar (pills) */
          <div className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* search field + input */}
              <div className="relative">
                <select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value as "sku" | "name")}
                  className="h-10 cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white pl-3.5 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-wm-blue"
                >
                  <option value="sku">SKU</option>
                  <option value="name">Item name</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              <div className="relative min-w-[14rem] flex-1 sm:max-w-sm">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchField === "sku" ? "Search by SKU" : "Search by item name"}
                  className="h-10 w-full rounded-lg border border-slate-300 pl-3.5 pr-9 text-sm outline-none focus:border-wm-blue focus:ring-2 focus:ring-wm-blue/20"
                />
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              <button
                type="button"
                onClick={() => setFavorites((f) => !f)}
                className={`${PILL} ${favorites ? "border-wm-blue bg-blue-50 text-wm-blue" : ""}`}
              >
                <Star className={`h-4 w-4 ${favorites ? "fill-wm-blue text-wm-blue" : ""}`} />
                Customer Favorites
              </button>
              <PillMenu
                id="lifecycle"
                label="Lifecycle"
                options={["Active", "Retiring soon", "Retired", "Archived"]}
                tool={tool}
                setTool={setTool}
              />
              <PillMenu
                id="price"
                label="Current price"
                options={["Has price", "No price", "Price changed", "On rollback"]}
                tool={tool}
                setTool={setTool}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <PillMenu
                id="fulfill"
                label="Fulfillment type"
                options={["Seller fulfilled", "Walmart Fulfillment Services", "Walmart+ Seller Fulfilled"]}
                tool={tool}
                setTool={setTool}
              />
              <PillMenu
                id="filters"
                label="Filters"
                icon={<SlidersHorizontal className="h-4 w-4" />}
                hideChevron
                options={["In stock", "Out of stock", "Low inventory", "Eligible for ads"]}
                tool={tool}
                setTool={setTool}
              />

              {/* Sort (functional) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTool(tool === "sort" ? null : "sort")}
                  className={`${PILL} ${sort ? "border-wm-blue text-wm-blue" : ""}`}
                >
                  <ArrowUpDown className="h-4 w-4" />
                  Sort
                  <ChevronDown className="h-4 w-4" />
                </button>
                {tool === "sort" && (
                  <>
                    <Overlay onClose={() => setTool(null)} />
                    <div className="absolute left-0 z-40 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                      {SORT_OPTIONS.map((o) => {
                        const active =
                          sort?.key === o.value.key && sort?.dir === o.value.dir;
                        return (
                          <button
                            key={o.label}
                            type="button"
                            onClick={() => {
                              setSort(o.value);
                              setTool(null);
                            }}
                            className={`block w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${
                              active ? "font-semibold text-wm-blue" : "text-slate-700"
                            }`}
                          >
                            {o.label}
                          </button>
                        );
                      })}
                      {sort && (
                        <button
                          type="button"
                          onClick={() => {
                            setSort(null);
                            setTool(null);
                          }}
                          className="mt-1 block w-full border-t border-slate-100 px-4 py-2 text-left text-sm text-slate-500 hover:bg-slate-50"
                        >
                          Clear sort
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Columns (functional) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTool(tool === "columns" ? null : "columns")}
                  className={PILL}
                >
                  <Columns3 className="h-4 w-4" />
                  Columns ({visibleColCount})
                </button>
                {tool === "columns" && (
                  <>
                    <Overlay onClose={() => setTool(null)} />
                    <div className="absolute left-0 z-40 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                      {COLUMNS.map((c) => (
                        <label
                          key={c.key}
                          className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={cols[c.key]}
                            onChange={() =>
                              setCols((p) => ({ ...p, [c.key]: !p[c.key] }))
                            }
                            className="h-4 w-4 rounded border-slate-300 accent-wm-blue"
                          />
                          {c.label}
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => downloadCsv(rows)}
                title="Download spreadsheet"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50"
              >
                <CloudDownload className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-y border-slate-200 bg-slate-50/60">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allChecked}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-slate-300 accent-wm-blue"
                  />
                </th>
                <th className={th}>Item Name</th>
                {cols.sku && <th className={th}>SKU</th>}
                {cols.status && <th className={th}>Status</th>}
                {cols.price && <th className={th}>Current Price (USD)</th>}
                {cols.bprice && (
                  <th className={th}>
                    <span className="inline-flex items-center gap-1">
                      Business price <Info className="h-3.5 w-3.5 text-slate-400" />
                    </span>
                  </th>
                )}
                {cols.bstrategy && (
                  <th className={th}>
                    <span className="inline-flex items-center gap-1">
                      Business strategy <Info className="h-3.5 w-3.5 text-slate-400" />
                    </span>
                  </th>
                )}
                {cols.inventory && (
                  <th className={th}>
                    <span className="inline-flex items-center gap-1">
                      Inventory <Info className="h-3.5 w-3.5 text-slate-400" />
                    </span>
                  </th>
                )}
                <th className={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={totalCols} className="px-4 py-16 text-center text-sm text-slate-400">
                    {decorated.length === 0
                      ? "No items in your catalog yet. Click “Add items” to create one."
                      : "No items match this view."}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        aria-label={`Select ${r.name}`}
                        checked={selected.has(r.id)}
                        onChange={() => toggleOne(r.id)}
                        className="h-4 w-4 rounded border-slate-300 accent-wm-blue"
                      />
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <ItemThumb category={r.category} title={r.name} size="sm" />
                        <span className="max-w-[18rem] truncate font-medium text-slate-900">
                          {r.name}
                        </span>
                      </div>
                    </td>
                    {cols.sku && (
                      <td className={`${td} whitespace-nowrap text-slate-600`}>{r.sku}</td>
                    )}
                    {cols.status && (
                      <td className={td}>
                        <StatusBadge status={r.status} />
                      </td>
                    )}
                    {cols.price && (
                      <td className={`${td} whitespace-nowrap font-medium text-slate-900`}>
                        {usd.format(r.price)}
                      </td>
                    )}
                    {cols.bprice && <td className={`${td} text-slate-400`}>Not eligible</td>}
                    {cols.bstrategy && <td className={`${td} text-slate-400`}>Not eligible</td>}
                    {cols.inventory && (
                      <td className={`${td} text-slate-700`}>{r.stock.toLocaleString()}</td>
                    )}
                    <td className={td}>
                      <RowActions
                        onEdit={() => setEditItem(r)}
                        onDelete={() => deleteOne(r.id)}
                        disabled={pending}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          Showing {rows.length} of {decorated.length}{" "}
          {decorated.length === 1 ? "item" : "items"}
        </div>
      </div>

      {/* Single edit modal */}
      {editItem && (
        <Modal onClose={() => setEditItem(null)} title="Edit item">
          <EditForm
            item={editItem}
            pending={pending}
            onSubmit={(fd) =>
              startTransition(async () => {
                await apiFetch(`/api/products/${fd.get("id")}`, {
                  method: "PATCH",
                  body: JSON.stringify(Object.fromEntries(fd)),
                });
                setEditItem(null);
                onChanged();
              })
            }
          />
        </Modal>
      )}

      {/* Bulk edit modal */}
      {bulkEditOpen && (
        <Modal
          onClose={() => setBulkEditOpen(false)}
          title={`Edit ${selected.size} item${selected.size === 1 ? "" : "s"}`}
        >
          <BulkEditForm
            count={selected.size}
            pending={pending}
            onSubmit={(price, stock) =>
              startTransition(async () => {
                const data: Record<string, string> = {};
                if (price !== "") data.price = price;
                if (stock !== "") data.stock = stock;
                await Promise.all(
                  [...selected].map((id) =>
                    apiFetch(`/api/products/${id}`, {
                      method: "PATCH",
                      body: JSON.stringify(data),
                    }),
                  ),
                );
                setBulkEditOpen(false);
                setSelected(new Set());
                onChanged();
              })
            }
          />
        </Modal>
      )}
    </div>
  );
}

function Overlay({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      aria-hidden
      tabIndex={-1}
      onClick={onClose}
      className="fixed inset-0 z-30 cursor-default"
    />
  );
}

function PillMenu({
  id,
  label,
  options,
  tool,
  setTool,
  icon,
  hideChevron,
}: {
  id: string;
  label: string;
  options: string[];
  tool: string | null;
  setTool: (v: string | null) => void;
  icon?: React.ReactNode;
  hideChevron?: boolean;
}) {
  const open = tool === id;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setTool(open ? null : id)}
        className={PILL}
      >
        {icon}
        {label}
        {!hideChevron && <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <>
          <Overlay onClose={() => setTool(null)} />
          <div className="absolute left-0 z-40 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            {options.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setTool(null)}
                className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                {o}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "Published")
    return (
      <span className="inline-flex rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        Published
      </span>
    );
  return (
    <span className="inline-flex rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      Unpublished
    </span>
  );
}

function RowActions({
  onEdit,
  onDelete,
  disabled,
}: {
  onEdit: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        aria-label="Item actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <Overlay onClose={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4 text-slate-400" />
              Edit details
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete item
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-900/40"
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EditForm({
  item,
  pending,
  onSubmit,
}: {
  item: Decorated;
  pending: boolean;
  onSubmit: (fd: FormData) => void;
}) {
  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={item.id} />
      <div>
        <label htmlFor="edit-name" className={labelClass}>
          Item name
        </label>
        <input id="edit-name" name="name" defaultValue={item.name} className={inputClass} required />
      </div>
      <div>
        <label htmlFor="edit-category" className={labelClass}>
          Category
        </label>
        <input
          id="edit-category"
          name="category"
          defaultValue={item.category}
          className={inputClass}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="edit-price" className={labelClass}>
            Price ($)
          </label>
          <input
            id="edit-price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={item.price}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="edit-stock" className={labelClass}>
            Inventory
          </label>
          <input
            id="edit-stock"
            name="stock"
            type="number"
            min="0"
            step="1"
            defaultValue={item.stock}
            className={inputClass}
            required
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-1 w-full rounded-full bg-wm-blue px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-wm-blue-dark disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

function BulkEditForm({
  count,
  pending,
  onSubmit,
}: {
  count: number;
  pending: boolean;
  onSubmit: (price: string, stock: string) => void;
}) {
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(price, stock);
      }}
      className="flex flex-col gap-4"
    >
      <p className="text-sm text-slate-500">
        Leave a field blank to keep it unchanged. Changes apply to all {count}{" "}
        selected item{count === 1 ? "" : "s"}.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="bulk-price" className={labelClass}>
            Price ($)
          </label>
          <input
            id="bulk-price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="No change"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="bulk-stock" className={labelClass}>
            Inventory
          </label>
          <input
            id="bulk-stock"
            type="number"
            min="0"
            step="1"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="No change"
            className={inputClass}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending || (price === "" && stock === "")}
        className="mt-1 w-full rounded-full bg-wm-blue px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-wm-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Applying…" : `Apply to ${count} item${count === 1 ? "" : "s"}`}
      </button>
    </form>
  );
}
