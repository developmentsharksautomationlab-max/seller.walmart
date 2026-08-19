import "server-only";
import { SignJWT, jwtVerify } from "jose";

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Read the secret lazily (at call time) rather than at module-evaluation time.
// Throwing at the top level breaks Next.js build-time config collection when the
// env var isn't present in the build environment; deferring it keeps the error
// where it belongs — the moment we actually need to sign/verify a token.
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
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createToken(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + MAX_AGE_MS);
  return encrypt({ userId, expiresAt: expiresAt.toISOString() });
}
