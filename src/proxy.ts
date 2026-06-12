import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

// Next.js 16 renamed Middleware to "Proxy" (same functionality, runs on the
// Node.js runtime). This does an *optimistic* auth check from the cookie only —
// the real authorization happens in the Data Access Layer (verifySession).
const publicRoutes = ["/login", "/signup"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);

  const cookie = req.cookies.get("session")?.value;
  const session = await decrypt(cookie);
  const isAuthed = Boolean(session?.userId);

  // Unauthenticated user hitting a protected route → send to login.
  if (!isAuthed && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Authenticated user hitting login/signup → send to dashboard.
  if (isAuthed && isPublicRoute) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

// Run on all routes except API, Next internals, and static assets.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
