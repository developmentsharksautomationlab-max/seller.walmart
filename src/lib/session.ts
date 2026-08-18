import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { ACCT_HEADER, sessionCookieName } from "@/lib/acct";

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Each account slot (see src/lib/acct.ts) gets its own cookie name, so a tab
// pinned to /u/2 never reads or clobbers the session a tab at / is using.
async function currentCookieName(): Promise<string> {
  const h = await headers();
  return sessionCookieName(h.get(ACCT_HEADER) ?? "1");
}

// Read the secret lazily (at call time) rather than at module-evaluation time.
// Throwing at the top level breaks Next.js build-time config collection when the
// env var isn't present in the build environment; deferring it keeps the error
// where it belongs — the moment we actually need to sign/verify a session.
function getEncodedKey(): Uint8Array {
  const secretKey = process.env.SESSION_SECRET;
  if (!secretKey) {
    throw new Error("SESSION_SECRET is not set. Add it to your .env file.");
  }
  return new TextEncoder().encode(secretKey);
}

export type SessionPayload = {
  userId: string;
  expiresAt: string; // ISO date
};

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getEncodedKey());
}

export async function decrypt(
  session: string | undefined,
): Promise<SessionPayload | null> {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + MAX_AGE_MS);
  const session = await encrypt({ userId, expiresAt: expiresAt.toISOString() });
  const cookieStore = await cookies();

  cookieStore.set(await currentCookieName(), session, {
    httpOnly: true,
    // `secure` must be false on http://localhost or the browser drops the cookie.
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(await currentCookieName());
}

export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(await currentCookieName())?.value;
}
