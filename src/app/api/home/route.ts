import { NextResponse } from "next/server";
import { getUserId } from "@/lib/api-auth";
import { getHomeData } from "@/lib/queries";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  const data = await getHomeData(userId, user?.name ?? "Seller");

  return NextResponse.json(data);
}
