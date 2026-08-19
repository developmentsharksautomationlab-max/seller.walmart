import { NextResponse } from "next/server";
import { getUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUSES } from "@/lib/definitions";
import { z } from "zod";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = z.enum(ORDER_STATUSES).safeParse(body?.status);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  // updateMany with a userId filter enforces ownership (a stray id from another
  // tenant simply matches no rows).
  await prisma.order.updateMany({
    where: { id, userId },
    data: { status: parsed.data },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.order.deleteMany({ where: { id, userId } });

  return NextResponse.json({ success: true });
}
