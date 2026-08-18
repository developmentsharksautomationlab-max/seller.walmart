// Multi-account tabs: each browser tab can be pinned to its own "account
// slot" via a /u/<n> URL prefix, so two tabs on the same browser can hold
// two different logged-in sessions at once (cookies alone are shared across
// all tabs of a browser, so the slot has to live in the URL). Slot 1 is the
// default/unprefixed experience — existing links and sessions keep working
// with zero change.
export const ACCT_HEADER = "x-acct";

const ACCT_PATH_RE = /^\/u\/([2-9][0-9]*)(\/.*)?$/;

/** "/u/2/orders" -> { acct: "2", innerPath: "/orders" }; "/orders" -> { acct: "1", innerPath: "/orders" } */
export function parseAcctPath(pathname: string): {
  acct: string;
  innerPath: string;
} {
  const match = ACCT_PATH_RE.exec(pathname);
  if (!match) return { acct: "1", innerPath: pathname };
  return { acct: match[1], innerPath: match[2] || "/" };
}

/** "1" -> "" (unprefixed), "2" -> "/u/2" */
export function acctPrefix(acct: string): string {
  return acct === "1" ? "" : `/u/${acct}`;
}

/** The /u/<n> prefix (or "") for whatever slot a given pathname belongs to. */
export function prefixFromPathname(pathname: string): string {
  return acctPrefix(parseAcctPath(pathname).acct);
}

/** Cookie name holding the session for a slot. Slot 1 keeps the original
 *  "session" name so accounts already logged in keep working unchanged. */
export function sessionCookieName(acct: string): string {
  return acct === "1" ? "session" : `session_u${acct}`;
}
