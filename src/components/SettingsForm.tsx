"use client";

import { useState } from "react";

export function SettingsForm({ initialLimit }: { initialLimit: number }) {
  const [budgetLimit, setBudgetLimit] = useState(String(initialLimit || ""));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const value = parseFloat(budgetLimit || "0");
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budgetLimit: value }),
    });
    if (!res.ok) {
      setError("Gagal menyimpan pengaturan.");
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-card shadow-card p-5 max-w-md space-y-4">
      <div>
        <label htmlFor="budgetLimit" className="block text-sm font-medium text-on-surface-variant mb-1.5">
          Batas Anggaran Bulanan (Rp)
        </label>
        <input
          id="budgetLimit"
          type="number"
          min="0"
          step="1000"
          value={budgetLimit}
          onChange={(e) => setBudgetLimit(e.target.value)}
          className="w-full rounded-input border border-outline-variant px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        />
        <p className="text-xs text-on-surface-variant mt-1.5">
          Peringatan otomatis akan muncul saat pengeluaran mencapai 90% dari batas ini.
        </p>
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      {saved && <p className="text-sm text-success">Pengaturan tersimpan.</p>}
      <button type="submit" className="rounded-pill bg-primary text-on-primary text-sm font-medium px-5 py-2.5 shadow-pill hover:opacity-90 transition">
        Simpan
      </button>
    </form>
  );
}
