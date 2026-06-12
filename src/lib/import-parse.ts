import { type OrderStatus } from "@/lib/definitions";

// Pure helpers for turning arbitrary spreadsheet rows into normalized import
// rows. No React / no server-only imports, so this runs in the browser, on the
// server, and in tests alike.

export type PreviewRow = {
  customerName: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  status: OrderStatus;
  date: string | null;
  valid: boolean;
  issues: string[];
};

const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const round2 = (n: number) => Math.round(n * 100) / 100;

const FIELD_SYNONYMS: Record<string, string[]> = {
  customerName: ["customer", "customername", "client", "buyer", "customers"],
  productName: ["product", "productname", "item", "items", "sku"],
  category: ["category", "categories", "cat", "type", "department"],
  quantity: ["quantity", "qty", "units", "unit", "count"],
  unitPrice: ["price", "unitprice", "rate", "cost", "priceperunit", "unitcost"],
  amount: ["amount", "total", "totalamount", "revenue", "sales", "totalprice", "value"],
  status: ["status", "paymentstatus", "state", "orderstatus"],
  date: ["date", "orderdate", "created", "createdat", "datetime", "time", "purchasedate"],
};

export function buildColumnMap(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const h of headers) {
    const n = norm(h);
    for (const [field, syns] of Object.entries(FIELD_SYNONYMS)) {
      if (!map[field] && syns.includes(n)) {
        map[field] = h;
        break;
      }
    }
  }
  return map;
}

export function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return isFinite(v) ? v : null;
  const cleaned = String(v).replace(/[^0-9.\-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

export function normStatus(v: unknown): OrderStatus {
  const n = norm(v);
  if (["delivered", "received", "completed", "complete", "fulfilled"].includes(n))
    return "Delivered";
  if (
    ["cancelled", "canceled", "refunded", "refund", "returned", "reversed", "void"].includes(n)
  )
    return "Canceled";
  if (
    ["unshipped", "pending", "unpaid", "processing", "awaiting", "open", "new", "created"].includes(
      n,
    )
  )
    return "Unshipped";
  return "Shipped";
}

export function normDate(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v.toISOString();
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

export function toPreview(
  raw: Record<string, unknown>,
  colMap: Record<string, string>,
): PreviewRow {
  const get = (field: string) => (colMap[field] ? raw[colMap[field]] : undefined);

  const customerName = String(get("customerName") ?? "").trim();
  const productName = String(get("productName") ?? "").trim();
  const category = String(get("category") ?? "").trim() || "Uncategorized";

  let quantity = num(get("quantity"));
  quantity = quantity == null ? 1 : Math.floor(quantity);

  let unitPrice = num(get("unitPrice"));
  let amount = num(get("amount"));
  if (unitPrice == null && amount != null && quantity > 0) unitPrice = amount / quantity;
  if (amount == null && unitPrice != null) amount = unitPrice * quantity;

  const issues: string[] = [];
  if (!customerName) issues.push("missing customer");
  if (!productName) issues.push("missing product");
  if (unitPrice == null || unitPrice < 0) issues.push("missing price/amount");
  if (quantity < 1) issues.push("invalid quantity");

  return {
    customerName,
    productName,
    category,
    quantity: Math.max(quantity, 0),
    unitPrice: round2(unitPrice ?? 0),
    amount: round2(amount ?? 0),
    status: normStatus(get("status")),
    date: normDate(get("date")),
    valid: issues.length === 0,
    issues,
  };
}
