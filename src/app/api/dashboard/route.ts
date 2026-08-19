import { NextResponse } from "next/server";
import { getUserId } from "@/lib/api-auth";
import { getDashboardData, resolveDashboardWindow } from "@/lib/queries";

export async function GET(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const sp = Object.fromEntries(url.searchParams) as {
    range?: string;
    s?: string;
    e?: string;
    cs?: string;
    ce?: string;
  };
  const { current, compare, activeRange, pickerDefaults } = resolveDashboardWindow(sp);
  const data = await getDashboardData(userId, current, compare);

  return NextResponse.json({ data, pickerDefaults, activeRange });
}
