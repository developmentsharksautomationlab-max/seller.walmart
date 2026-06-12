import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import CatalogClient, { type CatalogRow } from "./CatalogClient";

export default async function CatalogPage() {
  const { userId } = await verifySession();
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
    createdAtIso: p.createdAt.toISOString(),
  }));

  return <CatalogClient products={rows} />;
}
