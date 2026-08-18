import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";
import { ACCT_HEADER, parseAcctPath, sessionCookieName } from "@/lib/acct";

// Next.js 16 renamed Middleware to "Proxy" (same functionality, runs on the
// Node.js runtime). This does an *optimistic* auth check from the cookie only —
// the real authorization happens in the Data Access Layer (verifySession).
const publicRoutes = ["/login", "/signup"];

export default async function proxy(req: NextRequest) {
  // A /u/<n> prefix pins this tab to account slot n, with its own cookie —
  // that's how two tabs on the same browser can hold two different logged-in
  // accounts at once (plain cookies are shared across every tab). Slot 1 has
  // no prefix, so existing sessions/links are unaffected.
  const { acct, innerPath } = parseAcctPath(req.nextUrl.pathname);
  const prefix = acct === "1" ? "" : `/u/${acct}`;
  const isPublicRoute = publicRoutes.includes(innerPath);

  const cookie = req.cookies.get(sessionCookieName(acct))?.value;
  const session = await decrypt(cookie);
  const isAuthed = Boolean(session?.userId);

  // Unauthenticated user hitting a protected route → send to login.
  if (!isAuthed && !isPublicRoute) {
    return NextResponse.redirect(new URL(`${prefix}/login`, req.nextUrl));
  }

  // Authenticated user hitting login/signup → send to dashboard.
  if (isAuthed && isPublicRoute) {
    return NextResponse.redirect(new URL(prefix || "/", req.nextUrl));
  }

  // Tell the app which slot this request belongs to (DAL/session/actions read
  // this instead of re-parsing the URL) and, for prefixed slots, rewrite down
  // to the real (unprefixed) route.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(ACCT_HEADER, acct);

  if (prefix) {
    const rewritten = new URL(innerPath, req.nextUrl);
    rewritten.search = req.nextUrl.search;
    return NextResponse.rewrite(rewritten, {
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

// Run on all routes except API, Next internals, and static assets.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
