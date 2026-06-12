import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { decrypt, getSessionCookie } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/**
 * Verifies the request has a valid session. Redirects to /login if not.
 * Memoized per render pass so multiple callers share one check.
 */
export const verifySession = cache(async (): Promise<{ userId: string }> => {
  const cookie = await getSessionCookie();
  const session = await decrypt(cookie);

  if (!session?.userId) {
    redirect("/login");
  }

  return { userId: session.userId };
});

/** Returns the current user's safe fields, or null. */
export const getUser = cache(async () => {
  const session = await verifySession();
  try {
    return await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, createdAt: true },
    });
  } catch {
    return null;
  }
});
