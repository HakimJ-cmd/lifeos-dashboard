"use client";

import { useEffect, useState } from "react";
import { exportStyledExcel } from "@/lib/exportExcel";

type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  transactionDate: string;
  notes?: string | null;
  category?: { name: string } | null;
};

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export function FinanceBoard({ budgetLimit }: { budgetLimit: number }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  async function load() {
    setLoading(true);
    const res = await fetch("/api/finance");
    const data = await res.json();
    setTransactions(data.transactions ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const income = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const ratio = budgetLimit > 0 ? expense / budgetLimit : 0;

  // Rekap per bulan (untuk panel "Laporan Bulanan"), dikelompokkan dari data
  // transaksi yang sudah ada — tidak perlu request API terpisah.
  const monthlyReport = (() => {
    const map = new Map<string, { income: number; expense: number }>();
    for (const t of transactions) {
      const d = new Date(t.transactionDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const entry = map.get(key) ?? { income: 0, expense: 0 };
      if (t.type === "INCOME") entry.income += t.amount;
      else entry.expense += t.amount;
      map.set(key, entry);
    }
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1)) // terbaru dulu
      .map(([key, v]) => {
        const [year, month] = key.split("-").map(Number);
        const label = new Date(year, month - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
        return { key, label, income: v.income, expense: v.expense, balance: v.income - v.expense };
      });
  })();

  async function addTransaction(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || value <= 0) return;
    await fetch("/api/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        amount: value,
        transactionDate: new Date(date).toISOString(),
        notes: notes || null,
      }),
    });
    setAmount("");
    setNotes("");
    load();
  }

  async function removeTransaction(id: string) {
    await fetch(`/api/finance/${id}`, { method: "DELETE" });
    load();
  }

  function exportMonthlyReportCSV() {
    exportStyledExcel({
      filename: `laporan-bulanan-${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: "Laporan Bulanan",
      title: "Laporan Keuangan Bulanan — LifeOS Dashboard",
      columns: [
        { header: "Bulan", width: 22 },
        { header: "Pemasukan", width: 20, numberFormat: '"Rp"#,##0' },
        { header: "Pengeluaran", width: 20, numberFormat: '"Rp"#,##0' },
        { header: "Saldo", width: 20, numberFormat: '"Rp"#,##0' },
      ],
      rows: monthlyReport.map((m) => [m.label, m.income, m.expense, m.balance]),
    });
  }

  function exportTransactionsCSV() {
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
    );
    exportStyledExcel({
      filename: `transaksi-${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: "Riwayat Transaksi",
      title: "Riwayat Transaksi — LifeOS Dashboard",
      columns: [
        { header: "Tanggal", width: 14 },
        { header: "Tipe", width: 14 },
        { header: "Nominal", width: 18, numberFormat: '"Rp"#,##0' },
        { header: "Catatan", width: 34 },
      ],
      rows: sorted.map((t) => [
        new Date(t.transactionDate).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }),
        t.type === "INCOME" ? "Pemasukan" : "Pengeluaran",
        t.amount,
        t.notes ?? "",
      ]),
    });
  }

  return (
    <div>
      {budgetLimit > 0 && ratio >= 0.9 && (
        <div role="alert" className="flex items-center gap-3 bg-error-container text-on-error-container rounded-card px-4 py-3 mb-6">
          <span className="material-symbols-outlined">warning</span>
          <p className="text-sm font-medium">
            Pengeluaran sudah {Math.round(ratio * 100)}% dari batas bulanan {formatIDR(budgetLimit)}.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-container-lowest rounded-card shadow-card p-5">
          <p className="text-xs font-medium text-on-surface-variant uppercase">Pemasukan</p>
          <p className="font-display text-xl font-bold text-success mt-1">{formatIDR(income)}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-card shadow-card p-5">
          <p className="text-xs font-medium text-on-surface-variant uppercase">Pengeluaran</p>
          <p className="font-display text-xl font-bold text-error mt-1">{formatIDR(expense)}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-card shadow-card p-5">
          <p className="text-xs font-medium text-on-surface-variant uppercase">Saldo</p>
          <p className="font-display text-xl font-bold mt-1">{formatIDR(income - expense)}</p>
        </div>
      </div>

      <form onSubmit={addTransaction} className="bg-surface-container-lowest rounded-card shadow-card p-5 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
        <select value={type} onChange={(e) => setType(e.target.value as any)} className="rounded-input border border-outline-variant px-3.5 py-2.5 text-sm outline-none focus:border-primary">
          <option value="EXPENSE">Pengeluaran</option>
          <option value="INCOME">Pemasukan</option>
        </select>
        <input
          type="number"
          min="0"
          step="1000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Nominal (Rp)"
          className="rounded-input border border-outline-variant px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-input border border-outline-variant px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        />
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Catatan (opsional)"
          className="rounded-input border border-outline-variant px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        />
        <button type="submit" className="rounded-pill bg-primary text-on-primary text-sm font-medium px-5 py-2.5 shadow-pill hover:opacity-90 transition">
          Catat
        </button>
      </form>

      {monthlyReport.length > 0 && (
        <div className="bg-surface-container-lowest rounded-card shadow-card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-base">Laporan Bulanan</h2>
            <button
              onClick={exportMonthlyReportCSV}
              className="flex items-center gap-1.5 text-xs font-medium text-primary rounded-pill border border-primary px-3 py-1.5 hover:bg-primary/5 transition"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Export Excel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-on-surface-variant uppercase">
                  <th className="pb-2 pr-4 font-medium">Bulan</th>
                  <th className="pb-2 pr-4 font-medium">Pemasukan</th>
                  <th className="pb-2 pr-4 font-medium">Pengeluaran</th>
                  <th className="pb-2 font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {monthlyReport.map((m) => (
                  <tr key={m.key}>
                    <td className="py-2.5 pr-4 font-medium">{m.label}</td>
                    <td className="py-2.5 pr-4 text-success">{formatIDR(m.income)}</td>
                    <td className="py-2.5 pr-4 text-error">{formatIDR(m.expense)}</td>
                    <td className={`py-2.5 font-semibold ${m.balance >= 0 ? "" : "text-error"}`}>{formatIDR(m.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-base">Riwayat Transaksi</h2>
        {transactions.length > 0 && (
          <button
            onClick={exportTransactionsCSV}
            className="flex items-center gap-1.5 text-xs font-medium text-primary rounded-pill border border-primary px-3 py-1.5 hover:bg-primary/5 transition"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export Excel
          </button>
        )}
      </div>
      <div className="bg-surface-container-lowest rounded-card shadow-card divide-y divide-outline-variant/40">
        {loading && <p className="p-5 text-sm text-on-surface-variant">Memuat…</p>}
        {!loading && transactions.length === 0 && <p className="p-5 text-sm text-on-surface-variant">Belum ada transaksi.</p>}
        {transactions.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-surface-container-low transition">
            <div>
              <p className="text-sm font-medium">{t.notes || (t.type === "INCOME" ? "Pemasukan" : "Pengeluaran")}</p>
              <p className="text-xs text-on-surface-variant">{new Date(t.transactionDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-semibold ${t.type === "INCOME" ? "text-success" : "text-error"}`}>
                {t.type === "INCOME" ? "+" : "-"}{formatIDR(t.amount)}
              </span>
              <button onClick={() => removeTransaction(t.id)} aria-label="Hapus transaksi" className="text-on-surface-variant hover:text-error transition">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
