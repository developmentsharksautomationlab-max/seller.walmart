import { NextResponse } from "next/server";
import { getUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { OrderSchema, fieldErrors, type OrderStatus } from "@/lib/definitions";
import type { OrderRow } from "@/app/(app)/orders/OrdersTable";

export async function GET(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const rows: OrderRow[] = orders.map((o) => ({
    id: o.id,
    productName: o.productName,
    category: o.category,
    customerName: o.customerName,
    quantity: o.quantity,
    amount: o.amount,
    status: o.status as OrderStatus,
    createdAtIso: o.createdAt.toISOString(),
  }));

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = OrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }

  const { productId, customerName, quantity, status } = parsed.data;

  const product = await prisma.product.findFirst({ where: { id: productId, userId } });
  if (!product) {
    return NextResponse.json(
      { errors: { productId: ["Please choose a valid product."] } },
      { status: 400 },
    );
  }

  try {
    const order = await prisma.order.create({
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
    return NextResponse.json({ success: true, order });
  } catch {
    return NextResponse.json(
      { message: "Could not save the order. Please try again." },
      { status: 500 },
    );
  }
}
