import "server-only";
import { decrypt } from "@/lib/token";

// Route handlers use this instead of a cookie-based verifySession() — the
// client sends the token it holds in sessionStorage as a bearer header.
export async function getUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : undefined;
  const session = await decrypt(token);
  return session?.userId ?? null;
}
