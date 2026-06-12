import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { getUser } from "@/lib/dal";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // getUser() runs verifySession(), which redirects to /login when there is no
  // valid session. The extra null check covers a valid session for a deleted user.
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col bg-wm-bg">
      <Topbar userName={user.name} />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
