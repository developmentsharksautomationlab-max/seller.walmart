import { NextResponse } from "next/server";
import { getUserId } from "@/lib/api-auth";
import { getPerformanceMetrics } from "@/lib/queries";

export async function GET(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const metrics = await getPerformanceMetrics(userId);
  return NextResponse.json(metrics);
}
