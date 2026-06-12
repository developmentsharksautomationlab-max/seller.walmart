"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { ImportRowSchema, type ImportRow } from "@/lib/definitions";

const MAX_ROWS = 5000;

export type ImportResult = {
  imported: number;
  skipped: number;
  productsCreated: number;
  error?: string;
};

export async function importData(rows: unknown): Promise<ImportResult> {
  const { userId } = await verifySession();

  if (!Array.isArray(rows)) {
    return { imported: 0, skipped: 0, productsCreated: 0, error: "No data received." };
  }
  if (rows.length > MAX_ROWS) {
    return {
      imported: 0,
      skipped: 0,
      productsCreated: 0,
      error: `Too many rows (max ${MAX_ROWS}). Split the file and try again.`,
    };
  }

  // Re-validate every row server-side; silently skip ones that don't pass.
  const valid: ImportRow[] = [];
  let skipped = 0;
  for (const r of rows) {
    const parsed = ImportRowSchema.safeParse(r);
    if (parsed.success) valid.push(parsed.data);
    else skipped++;
  }
  if (valid.length === 0) {
    return { imported: 0, skipped, productsCreated: 0, error: "No valid rows to import." };
  }

  try {
    // Map this user's existing products by lowercased name.
    const existing = await prisma.product.findMany({
      where: { userId },
      select: { id: true, name: true },
    });
    const nameToId = new Map(existing.map((p) => [p.name.toLowerCase(), p.id]));

    // Auto-create a product for each new product name (first row wins for price/category).
    const newProducts = new Map<string, { name: string; category: string; price: number }>();
    for (const r of valid) {
      const key = r.productName.toLowerCase();
      if (!nameToId.has(key) && !newProducts.has(key)) {
        newProducts.set(key, { name: r.productName, category: r.category, price: r.unitPrice });
      }
    }

    let productsCreated = 0;
    if (newProducts.size > 0) {
      const toCreate = [...newProducts.values()];
      await prisma.product.createMany({
        data: toCreate.map((p) => ({
          userId,
          name: p.name,
          category: p.category,
          price: p.price,
          stock: 0,
        })),
      });
      productsCreated = toCreate.length;

      const created = await prisma.product.findMany({
        where: { userId, name: { in: toCreate.map((p) => p.name) } },
        select: { id: true, name: true },
      });
      for (const p of created) nameToId.set(p.name.toLowerCase(), p.id);
    }

    await prisma.order.createMany({
      data: valid.map((r) => ({
        userId,
        productId: nameToId.get(r.productName.toLowerCase()) ?? null,
        productName: r.productName,
        category: r.category,
        customerName: r.customerName,
        quantity: r.quantity,
        unitPrice: r.unitPrice,
        amount: r.amount,
        status: r.status,
        createdAt: r.date ? new Date(r.date) : new Date(),
      })),
    });

    revalidatePath("/");
    revalidatePath("/orders");
    revalidatePath("/products");
    return { imported: valid.length, skipped, productsCreated };
  } catch (err) {
    console.error("[import] failed:", err);
    return { imported: 0, skipped, productsCreated: 0, error: "Import failed. Please try again." };
  }
}
