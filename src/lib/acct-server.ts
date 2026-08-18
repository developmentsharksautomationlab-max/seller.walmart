import "server-only";
import { headers } from "next/headers";
import { ACCT_HEADER, acctPrefix } from "@/lib/acct";

/** The account slot for the current request, set by proxy.ts from the URL. */
export async function getAcct(): Promise<string> {
  const h = await headers();
  return h.get(ACCT_HEADER) ?? "1";
}

/** The /u/<n> prefix (or "") to keep redirects/links inside the current slot. */
export async function getAcctPrefix(): Promise<string> {
  return acctPrefix(await getAcct());
}
