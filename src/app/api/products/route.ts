import { NextResponse } from "next/server";
import { getUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { ProductSchema, fieldErrors } from "@/lib/definitions";
import type { CatalogRow } from "@/app/(app)/products/CatalogClient";

export async function GET(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const rows: CatalogRow[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    stock: p.stock,
    imageUrl: p.imageUrl,
    createdAtIso: p.createdAt.toISOString(),
  }));

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = ProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }

  const { name, category, price, stock, imageUrl } = parsed.data;
  try {
    const product = await prisma.product.create({
      data: { userId, name, category, price, stock, imageUrl: imageUrl || null },
    });
    return NextResponse.json({ success: true, product });
  } catch {
    return NextResponse.json(
      { message: "Could not save the product. Please try again." },
      { status: 500 },
    );
  }
}
