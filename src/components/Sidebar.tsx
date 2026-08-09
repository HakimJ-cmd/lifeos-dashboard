"use client";

import Link from "next/link";
import { useState } from "react";
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

// Menu yang tidak muat di bottom nav mobile (cuma 5 slot)
const MORE_ITEMS = NAV_ITEMS.slice(5);

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
        <div className="w-9 h-9 rounded-input bg-secondary flex items-center justify-center font-display font-bold">L</div>
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

export function MobileTopBar({ userName }: { userName: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-surface px-4 py-3">
      <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-input bg-secondary text-inverse-on-surface flex items-center justify-center font-display font-bold text-sm">
        L
      </div>
        <span className="font-display font-bold text-base">LifeOS</span>
      </div>

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu akun"
          className="w-9 h-9 rounded-full bg-dark-slate text-inverse-on-surface flex items-center justify-center"
        >
          <Icon name={open ? "close" : "menu"} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 mt-2 w-56 bg-dark-slate text-inverse-on-surface rounded-card shadow-elevated p-2 z-50">
              <div className="px-3 py-2 text-xs text-white/50 truncate">{userName}</div>
              {MORE_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-pill text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition"
                >
                  <Icon name={item.icon} />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-pill text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition"
              >
                <Icon name="logout" />
                Keluar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}