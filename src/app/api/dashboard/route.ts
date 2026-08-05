import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { recomputeTodayProductivity } from "@/lib/productivity";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [todayLog, allTx, recentTasks, weekLogs, recentTx] = await Promise.all([
    recomputeTodayProductivity(user.id),
    prisma.transaction.findMany({
      where: { userId: user.id },
    }),
    prisma.task.findMany({
      where: { userId: user.id, status: { in: ["PENDING", "IN_PROGRESS", "OVERDUE"] } },
      orderBy: { deadline: "asc" },
      take: 6,
      include: { project: { select: { name: true } } },
    }),
    prisma.productivityLog.findMany({
      where: { userId: user.id },
      orderBy: { logDate: "desc" },
      take: 7,
    }),
    prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { transactionDate: "desc" },
      take: 5,
      include: { category: { select: { name: true } } },
    }),
  ]);

  // Saldo & pengeluaran di kartu utama Dashboard sekarang ALL-TIME (konsisten
  // dengan halaman Keuangan), bukan cuma bulan berjalan.
  const income = allTx
    .filter((t: { type: string }) => t.type === "INCOME")
    .reduce((s: number, t: { amount: number }) => s + t.amount, 0);
  const expense = allTx
    .filter((t: { type: string }) => t.type === "EXPENSE")
    .reduce((s: number, t: { amount: number }) => s + t.amount, 0);
  const balance = income - expense;

  // FIN-3 (peringatan budget) TETAP dihitung per bulan berjalan saja, karena
  // budgetLimit itu konsepnya jatah bulanan — bukan jatah seumur hidup.
  const monthExpense = allTx
    .filter(
      (t: { type: string; transactionDate: Date }) =>
        t.type === "EXPENSE" && t.transactionDate >= startOfMonth && t.transactionDate < startOfNextMonth
    )
    .reduce((s: number, t: { amount: number }) => s + t.amount, 0);
  const budgetLimit = user.budgetLimit;
  const budgetRatio = budgetLimit > 0 ? monthExpense / budgetLimit : 0;
  const budgetWarning = budgetLimit > 0 && budgetRatio >= 0.9;

  return NextResponse.json({
    user: { name: user.name, budgetLimit },
    finance: { income, expense, balance, monthExpense, budgetRatio, budgetWarning },
    productivity: { today: todayLog, week: weekLogs.reverse() },
    tasks: recentTasks,
    recentTransactions: recentTx,
  });
}
