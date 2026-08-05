"use client";

import { useRouter } from "next/navigation";

export function ClientLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs font-medium text-on-surface-variant hover:text-error transition flex items-center gap-1.5"
    >
      <span className="material-symbols-outlined text-[18px]">logout</span>
      Keluar
    </button>
  );
}
