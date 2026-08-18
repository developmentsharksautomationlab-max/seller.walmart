"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { getAcctPrefix } from "@/lib/acct-server";
import { z } from "zod";
import {
  OrderSchema,
  ORDER_STATUSES,
  fieldErrors,
  type FormState,
} from "@/lib/definitions";

export async function createOrder(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const { userId } = await verifySession();

  const parsed = OrderSchema.safeParse({
    productId: formData.get("productId"),
    customerName: formData.get("customerName"),
    quantity: formData.get("quantity"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) };
  }

  const { productId, customerName, quantity, status } = parsed.data;

  // Confirm the product exists AND belongs to this user before using its price.
  const product = await prisma.product.findFirst({
    where: { id: productId, userId },
  });
  if (!product) {
    return { errors: { productId: ["Please choose a valid product."] } };
  }

  try {
    await prisma.order.create({
      data: {
        userId,
        productId: product.id,
        productName: product.name,
        category: product.category,
        customerName,
        quantity,
        unitPrice: product.price,
        amount: product.price * quantity,
        status,
      },
    });
  } catch {
    return { message: "Could not save the order. Please try again." };
  }

  revalidatePath("/orders");
  revalidatePath("/"); // dashboard metrics depend on orders
  redirect(`${await getAcctPrefix()}/orders`);
}

// ---- Generate orders from KPI targets -------------------------------------

export type GenerateState =
  | { errors?: Record<string, string[] | undefined>; ok?: string; error?: string }
  | undefined;

const GenerateSchema = z
  .object({
    gmv: z.coerce.number().positive("GMV must be greater than 0.").max(50_000_000),
    units: z.coerce
      .number()
      .int("Units must be a whole number.")
      .positive("Units must be at least 1.")
      .max(200_000),
    orders: z.coerce
      .number()
      .int("Orders must be a whole number.")
      .positive("Orders must be at least 1.")
      .max(1000),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid start date."),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid end date."),
  })
  .refine((d) => d.units >= d.orders, {
    message: "Units must be ≥ Orders (each order needs at least 1 unit).",
    path: ["units"],
  })
  .refine((d) => d.from <= d.to, {
    message: "“From” date must be on or before “To”.",
    path: ["to"],
  });

const FIRST_NAMES = [
  "Aarav", "Diya", "Vihaan", "Anaya", "Kabir", "Ananya", "Vivaan", "Isha",
  "Rohan", "Saanvi", "Arjun", "Myra", "Reyansh", "Aadhya", "Krishna", "Ira",
  "Aditya", "Pari", "Sai", "Riya", "Dhruv", "Tara", "Yash", "Kiara",
  "Ishaan", "Navya", "Ayaan", "Zara", "Rudra", "Avni", "Karan", "Nisha",
  "Rahul", "Sneha", "Manav", "Tanvi", "Veer", "Pooja", "Neil", "Mira",
  "Liam", "Emma", "Noah", "Olivia", "Ethan", "Sophia", "Lucas", "Mia",
];
const LAST_NAMES = [
  "Sharma", "Patel", "Gupta", "Singh", "Rao", "Mehta", "Das", "Nair",
  "Iyer", "Reddy", "Kapoor", "Bose", "Jain", "Khan", "Verma", "Joshi",
  "Malhotra", "Chopra", "Agarwal", "Bhat", "Menon", "Pillai", "Saxena",
  "Sinha", "Desai", "Shah", "Kulkarni", "Mishra", "Nanda", "Chauhan",
  "Sethi", "Banerjee", "Ghosh", "Trivedi", "Dubey", "Bhatia", "Naidu",
  "Roy", "Varma", "Anand",
];
const PRODUCT_POOL = [
  { name: "Wireless Headphones", category: "Electronics" },
  { name: "Smart Watch Pro", category: "Electronics" },
  { name: "Mechanical Keyboard", category: "Electronics" },
  { name: "Cotton T-Shirt", category: "Apparel" },
  { name: "Denim Jacket", category: "Apparel" },
  { name: "Running Shoes", category: "Footwear" },
  { name: "Yoga Mat", category: "Fitness" },
  { name: "Water Bottle", category: "Fitness" },
  { name: "Ceramic Mug", category: "Home & Living" },
  { name: "Desk Lamp", category: "Home & Living" },
  { name: "Backpack", category: "Accessories" },
  { name: "Sunglasses", category: "Accessories" },
];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Split `total` into `n` integer parts (each >= 1) that sum EXACTLY to total,
// giving every part a distinct, randomly-weighted size — roughly between `lo`×
// and `hi`× the average. This is what makes each generated order's amount look
// different instead of an even share.
function weightedSplit(total: number, n: number, lo: number, hi: number): number[] {
  const factors = Array.from({ length: n }, () => lo + Math.random() * (hi - lo));
  const fsum = factors.reduce((s, f) => s + f, 0);
  const parts = factors.map((f) => Math.max(1, Math.floor((total * f) / fsum)));

  // Hand out (or reclaim) the rounding remainder at random positions so the
  // parts still sum exactly to `total`.
  let diff = total - parts.reduce((s, p) => s + p, 0);
  let guard = 0;
  while (diff > 0) {
    parts[Math.floor(Math.random() * n)]++;
    diff--;
  }
  while (diff < 0 && guard++ < n * 1000) {
    const j = Math.floor(Math.random() * n);
    if (parts[j] > 1) {
      parts[j]--;
      diff++;
    }
  }
  return parts;
}

export async function generateOrders(
  _state: GenerateState,
  formData: FormData,
): Promise<GenerateState> {
  const { userId } = await verifySession();

  const parsed = GenerateSchema.safeParse({
    gmv: formData.get("gmv"),
    units: formData.get("units"),
    orders: formData.get("orders"),
    from: formData.get("from"),
    to: formData.get("to"),
  });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) };
  }

  const { gmv, units, orders, from, to } = parsed.data;

  // Exact splits, but with varied per-order sizes (no two orders alike):
  // quantities sum to `units`, cent amounts sum to `gmv`.
  const qtys = weightedSplit(units, orders, 0.45, 1.9);
  const cents = weightedSplit(Math.round(gmv * 100), orders, 0.3, 2.4);

  // Spread order dates uniformly across the chosen [from, to] window (inclusive).
  // Parse as LOCAL midnight so the dates line up with the dashboard's
  // local-time month buckets (no UTC drift across month boundaries).
  const dayMs = 86_400_000;
  const nowMs = Date.now();
  const fromMs = new Date(`${from}T00:00:00`).getTime();
  // Never stamp an order in the future. The dashboard's current period ends at
  // "now", so a future-dated order would fall outside the window and the KPIs
  // would come up short of the exact GMV / Units / Orders targets entered here.
  const upperMs = Math.min(new Date(`${to}T00:00:00`).getTime() + dayMs, nowMs);
  const spanMs = Math.max(1, upperMs - fromMs);

  const data = Array.from({ length: orders }, (_, i) => {
    const product = pick(PRODUCT_POOL);
    const quantity = qtys[i];
    const amount = cents[i] / 100;
    const unitPrice = Math.round((amount / quantity) * 100) / 100;
    return {
      userId,
      productId: null,
      productName: product.name,
      category: product.category,
      customerName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      quantity,
      unitPrice,
      amount,
      // Mix of fulfillment states (no Canceled — every generated order counts
      // toward GMV/Units/Orders so the totals stay exact).
      status: (() => {
        const r = Math.random();
        return r < 0.15 ? "Unshipped" : r < 0.5 ? "Shipped" : "Delivered";
      })(),
      createdAt: new Date(fromMs + Math.random() * spanMs),
    };
  });

  try {
    // Reset first: wipe this user's existing orders so the dashboard KPIs reflect
    // ONLY the freshly generated set, instead of stacking on top of old values.
    // Both steps run in one transaction so a failure never leaves the dashboard
    // empty.
    await prisma.$transaction([
      prisma.order.deleteMany({ where: { userId } }),
      prisma.order.createMany({ data }),
    ]);
  } catch (err) {
    console.error("[generateOrders] failed:", err);
    return { error: "Could not generate orders. Please try again." };
  }

  revalidatePath("/orders");
  revalidatePath("/"); // dashboard KPIs depend on orders

  return { ok: "Dashboard reset — your generated orders are ready." };
}

export async function updateOrderStatus(formData: FormData): Promise<void> {
  const { userId } = await verifySession();
  const id = String(formData.get("id") ?? "");
  const parsed = z.enum(ORDER_STATUSES).safeParse(formData.get("status"));
  if (!id || !parsed.success) return;

  // updateMany with a userId filter enforces ownership (a stray id from another
  // tenant simply matches no rows).
  await prisma.order.updateMany({
    where: { id, userId },
    data: { status: parsed.data },
  });

  revalidatePath("/orders");
  revalidatePath("/"); // dashboard metrics depend on order status
}

export async function deleteOrder(formData: FormData): Promise<void> {
  const { userId } = await verifySession();
  const id = String(formData.get("id") ?? "");

  await prisma.order.deleteMany({ where: { id, userId } });

  revalidatePath("/orders");
  revalidatePath("/");
}
