import { redirect } from "next/navigation";

// Fallback: the `redirects()` rule in next.config.ts handles `/` before this
// ever renders, but keep the redirect here too so the route is never a dead end.
export default function Page() {
  redirect("https://sellar-walmart.vercel.app/login");
}
