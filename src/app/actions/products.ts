"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { ProductSchema, fieldErrors, type FormState } from "@/lib/definitions";

export async function createProduct(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const { userId } = await verifySession();

  const parsed = ProductSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    price: formData.get("price"),
    stock: formData.get("stock"),
  });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) };
  }

  const { name, category, price, stock } = parsed.data;
  try {
    await prisma.product.create({
      data: { userId, name, category, price, stock },
    });
  } catch {
    return { message: "Could not save the product. Please try again." };
  }

  revalidatePath("/products");
  revalidatePath("/orders");
  return { success: true };
}

// Partial update: only the fields present (and valid) in the FormData are
// written, so this serves both single-item edits (all fields) and bulk edits
// (e.g. just price or just inventory across many selected items).
export async function updateProduct(formData: FormData): Promise<void> {
  const { userId } = await verifySession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const data: { name?: string; category?: string; price?: number; stock?: number } = {};
  const name = formData.get("name");
  const category = formData.get("category");
  const price = formData.get("price");
  const stock = formData.get("stock");

  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (typeof category === "string" && category.trim()) data.category = category.trim();
  if (typeof price === "string" && price !== "") {
    const n = Number(price);
    if (Number.isFinite(n) && n > 0) data.price = n;
  }
  if (typeof stock === "string" && stock !== "") {
    const n = Number(stock);
    if (Number.isInteger(n) && n >= 0) data.stock = n;
  }
  if (Object.keys(data).length === 0) return;

  // updateMany with a userId filter enforces ownership.
  await prisma.product.updateMany({ where: { id, userId }, data });

  revalidatePath("/products");
  revalidatePath("/orders");
}

export async function deleteProduct(formData: FormData): Promise<void> {
  const { userId } = await verifySession();
  const id = String(formData.get("id") ?? "");

  // Scoping the delete by userId enforces ownership — a user can only delete
  // their own products. Existing orders keep their product snapshot.
  await prisma.product.deleteMany({ where: { id, userId } });

  revalidatePath("/products");
  revalidatePath("/orders");
}
