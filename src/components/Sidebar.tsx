"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "grid_view" },
  { href: "/tasks", label: "Tugas", icon: "checklist" },
  { href: "/projects", label: "Proyek", icon: "folder_open" },
  { href: "/clients", label: "Klien", icon: "groups" },
  { href: "/finance", label: "Keuangan", icon: "payments" },
  { href: "/productivity", label: "Insights", icon: "insights" },
  { href: "/settings", label: "Pengaturan", icon: "settings" },
];

function Icon({ name }: { name: string }) {
  return <span className="material-symbols-outlined text-[20px]">{name}</span>;
}

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 bg-dark-slate text-inverse-on-surface rounded-card m-4 mr-0 p-5">
      <div className="flex items-center gap-2.5 mb-8 px-1">
        <div className="w-9 h-9 rounded-input bg-primary flex items-center justify-center font-display font-bold">L</div>
        <span className="font-display font-bold text-lg">LifeOS</span>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-pill text-sm font-medium transition ${
                active ? "bg-primary text-on-primary shadow-pill" : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 pt-4 mt-4">
        <div className="px-3.5 text-xs text-white/50 mb-2 truncate">{userName}</div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-pill text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition"
        >
          <Icon name="logout" />
          Keluar
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-30 bg-dark-slate rounded-pill shadow-elevated flex items-center justify-around py-2 px-2">
      {NAV_ITEMS.slice(0, 5).map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-center w-11 h-11 rounded-full transition ${
              active ? "bg-primary text-on-primary shadow-pill" : "text-white/60"
            }`}
            aria-label={item.label}
          >
            <Icon name={item.icon} />
          </Link>
        );
      })}
    </nav>
  );
}
