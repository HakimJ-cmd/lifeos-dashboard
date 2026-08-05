import { getCurrentUser } from "@/lib/auth";
import { FinanceBoard } from "@/components/FinanceBoard";

export default async function FinancePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Pengelolaan Keuangan</h1>
        <p className="text-on-surface-variant text-sm mt-1">Catat arus kas dan pantau batas anggaran bulanan.</p>
      </div>
      <FinanceBoard budgetLimit={user.budgetLimit} />
    </div>
  );
}
