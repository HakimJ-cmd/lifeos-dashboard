import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { recomputeTodayProductivity } from "@/lib/productivity";
import { StatCard } from "@/components/StatCard";
import { BudgetWarningBanner } from "@/components/BudgetWarningBanner";
import { ProductivityChart } from "@/components/ProductivityChart";

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default async function OverviewPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [todayLog, weekLogs, allTx, upcomingTasks] = await Promise.all([
    recomputeTodayProductivity(user.id),
    prisma.productivityLog.findMany({ where: { userId: user.id }, orderBy: { logDate: "desc" }, take: 7 }),
    prisma.transaction.findMany({ where: { userId: user.id } }),
    prisma.task.findMany({
      where: { userId: user.id, status: { in: ["PENDING", "IN_PROGRESS", "OVERDUE"] } },
      orderBy: { deadline: "asc" },
      take: 5,
      include: { project: { select: { name: true } } },
    }),
  ]);

  // Saldo & pengeluaran di kartu Dashboard: ALL-TIME, konsisten dengan
  // halaman Keuangan (bukan cuma bulan berjalan lagi).
  const income = allTx
    .filter((t: { type: string }) => t.type === "INCOME")
    .reduce((s: number, t: { amount: number }) => s + t.amount, 0);
  const expense = allTx
    .filter((t: { type: string }) => t.type === "EXPENSE")
    .reduce((s: number, t: { amount: number }) => s + t.amount, 0);
  const balance = income - expense;

  // Peringatan budget (FIN-3) TETAP dihitung dari pengeluaran BULAN INI saja,
  // karena batas anggaran itu konsepnya jatah per bulan.
  const monthExpense = allTx
    .filter(
      (t: { type: string; transactionDate: Date }) =>
        t.type === "EXPENSE" && t.transactionDate >= startOfMonth && t.transactionDate < startOfNextMonth
    )
    .reduce((s: number, t: { amount: number }) => s + t.amount, 0);
  const ratio = user.budgetLimit > 0 ? monthExpense / user.budgetLimit : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold">Selamat datang, {user.name.split(" ")[0]}.</h1>
        <p className="text-on-surface-variant text-sm mt-1">Berikut ringkasan produktivitas dan keuangan Anda hari ini.</p>
      </div>

      {ratio >= 0.9 && <BudgetWarningBanner ratio={ratio} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Skor Produktivitas" value={`${todayLog.productivityScore}%`} hint="Hari ini" />
        <StatCard label="Saldo" value={formatIDR(balance)} tone={balance >= 0 ? "success" : "error"} hint="Seluruh transaksi" />
        <StatCard label="Pengeluaran Bulan Ini" value={formatIDR(monthExpense)} hint={user.budgetLimit > 0 ? `dari batas ${formatIDR(user.budgetLimit)}` : undefined} />
        <StatCard label="Tugas Aktif" value={String(upcomingTasks.length)} hint="Perlu perhatian" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-card shadow-card p-5">
          <h2 className="font-display font-semibold text-base mb-4">Produktivitas 7 Hari Terakhir</h2>
          <ProductivityChart data={weekLogs.reverse().map((l: { logDate: Date; productivityScore: number; lazyScore: number }) => ({ ...l, logDate: l.logDate.toISOString() }))} />
        </div>

        <div className="bg-surface-container-lowest rounded-card shadow-card p-5">
          <h2 className="font-display font-semibold text-base mb-4">Tugas Mendekati Deadline</h2>
          <ul className="space-y-3">
            {upcomingTasks.length === 0 && <p className="text-sm text-on-surface-variant">Tidak ada tugas aktif. Tambahkan tugas baru untuk mulai melacak produktivitas.</p>}
            {upcomingTasks.map((t: (typeof upcomingTasks)[number]) => (
              <li key={t.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-on-surface-variant">{t.project?.name ?? "Tanpa proyek"}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-pill shrink-0 ${
                    t.status === "OVERDUE" ? "bg-error-container text-on-error-container" : "bg-secondary-container text-on-secondary-container"
                  }`}
                >
                  {t.deadline ? new Date(t.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "Tanpa deadline"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
