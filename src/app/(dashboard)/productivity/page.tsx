import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { recomputeTodayProductivity } from "@/lib/productivity";
import { ProductivityChart } from "@/components/ProductivityChart";
import { ProgressRing } from "@/components/ProgressRing";

export default async function ProductivityPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const today = await recomputeTodayProductivity(user.id);
  const logs = await prisma.productivityLog.findMany({
    where: { userId: user.id },
    orderBy: { logDate: "desc" },
    take: 14,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Insights Produktivitas</h1>
        <p className="text-on-surface-variant text-sm mt-1">Skor produktivitas vs. lazy score, berbobot prioritas tugas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-container-lowest rounded-card shadow-card p-5 flex items-center gap-4">
          <ProgressRing percent={today.productivityScore} size={72} />
          <div>
            <p className="text-xs font-medium text-on-surface-variant uppercase">Produktivitas Hari Ini</p>
            <p className="font-display text-xl font-bold">{today.productivityScore}%</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-card shadow-card p-5">
          <p className="text-xs font-medium text-on-surface-variant uppercase">Tugas Selesai</p>
          <p className="font-display text-2xl font-bold mt-1">{today.completedTasksCount}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-card shadow-card p-5">
          <p className="text-xs font-medium text-on-surface-variant uppercase">Tugas Terlambat</p>
          <p className="font-display text-2xl font-bold mt-1 text-error">{today.overdueTasksCount}</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-card shadow-card p-5 mb-6">
        <h2 className="font-display font-semibold text-base mb-4">Tren 14 Hari Terakhir</h2>
        <ProductivityChart data={logs.reverse().map((l: (typeof logs)[number]) => ({ ...l, logDate: l.logDate.toISOString() }))} />
      </div>

      <div className="bg-surface-container-lowest rounded-card shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-on-surface-variant uppercase border-b border-outline-variant/40">
              <th className="px-5 py-3 font-medium">Tanggal</th>
              <th className="px-5 py-3 font-medium">Selesai</th>
              <th className="px-5 py-3 font-medium">Terlambat</th>
              <th className="px-5 py-3 font-medium">Skor Produktivitas</th>
              <th className="px-5 py-3 font-medium">Lazy Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40">
            {logs.map((l: (typeof logs)[number]) => (
              <tr key={l.id}>
                <td className="px-5 py-3">{new Date(l.logDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</td>
                <td className="px-5 py-3">{l.completedTasksCount}</td>
                <td className="px-5 py-3">{l.overdueTasksCount}</td>
                <td className="px-5 py-3 font-medium text-primary">{l.productivityScore}%</td>
                <td className="px-5 py-3 text-on-surface-variant">{l.lazyScore}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
