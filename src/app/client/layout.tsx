import { redirect } from "next/navigation";
import { getCurrentClient } from "@/lib/auth";
import { ClientLogoutButton } from "@/components/ClientLogoutButton";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const client = await getCurrentClient();
  if (!client) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-5 py-4 bg-surface-container-lowest shadow-card mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-input bg-primary flex items-center justify-center text-on-primary font-display font-bold text-sm">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium leading-tight">{client.name}</p>
            <p className="text-xs text-on-surface-variant leading-tight">Portal Client</p>
          </div>
        </div>
        <ClientLogoutButton />
      </header>
      <main className="max-w-3xl mx-auto px-4">{children}</main>
    </div>
  );
}
