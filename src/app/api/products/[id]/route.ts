import { NextResponse } from "next/server";
import { getUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// Partial update: only the fields present (and valid) in the body are
// written, so this serves both single-item edits (all fields) and bulk edits
// (e.g. just price or just inventory across many selected items).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: {
    name?: string;
    category?: string;
    price?: number;
    stock?: number;
    imageUrl?: string | null;
  } = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.category === "string" && body.category.trim())
    data.category = body.category.trim();
  if (body.price !== undefined && body.price !== "") {
    const n = Number(body.price);
    if (Number.isFinite(n) && n > 0) data.price = n;
  }
  if (body.stock !== undefined && body.stock !== "") {
    const n = Number(body.stock);
    if (Number.isInteger(n) && n >= 0) data.stock = n;
  }
  if (typeof body.imageUrl === "string") data.imageUrl = body.imageUrl.trim() || null;
  if (Object.keys(data).length === 0) return NextResponse.json({ success: true });

  // updateMany with a userId filter enforces ownership.
  await prisma.product.updateMany({ where: { id, userId }, data });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  // Scoping the delete by userId enforces ownership — a user can only delete
  // their own products. Existing orders keep their product snapshot.
  await prisma.product.deleteMany({ where: { id, userId } });

  return NextResponse.json({ success: true });
}
