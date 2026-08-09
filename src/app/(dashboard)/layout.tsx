import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar, MobileNav, MobileTopBar } from "@/components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar userName={user.name} />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileTopBar userName={user.name} />
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-[1440px] mx-auto w-full">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}