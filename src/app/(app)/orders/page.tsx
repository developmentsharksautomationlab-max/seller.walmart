import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@/lib/definitions";
import OrdersTable, { type OrderRow } from "./OrdersTable";

export default async function OrdersPage() {
  const { userId } = await verifySession();

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

  return <OrdersTable orders={rows} />;
}
