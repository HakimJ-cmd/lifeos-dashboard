import { prisma } from "./db";

const PRIORITY_WEIGHT: Record<string, number> = { LOW: 1, MEDIUM: 1.5, HIGH: 2 };

// Menjawab pertanyaan terbuka #3 di PRD (Bab 12): skor dihitung berbobot
// prioritas, bukan cuma kuantitas mentah — tugas HIGH priority yang selesai
// tepat waktu berkontribusi lebih besar ke productivityScore, dan yang
// overdue menghukum lazyScore lebih besar juga.
export async function recomputeTodayProductivity(userId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  // Auto-flag task yang lewat deadline tapi belum selesai (TASK-3).
  await prisma.task.updateMany({
    where: {
      userId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      deadline: { lt: new Date() },
    },
    data: { status: "OVERDUE" },
  });

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      OR: [
        { completedAt: { gte: startOfDay, lt: endOfDay } },
        { status: "OVERDUE" },
        { status: { in: ["PENDING", "IN_PROGRESS"] } },
      ],
    },
    select: { status: true, priority: true },
  });

  let completedWeight = 0;
  let overdueWeight = 0;
  let completedCount = 0;
  let overdueCount = 0;
  let pendingCount = 0;

  for (const t of tasks) {
    const w = PRIORITY_WEIGHT[t.priority] ?? 1;
    if (t.status === "COMPLETED") {
      completedWeight += w;
      completedCount += 1;
    } else if (t.status === "OVERDUE") {
      overdueWeight += w;
      overdueCount += 1;
    } else {
      pendingCount += 1;
    }
  }

  const totalWeight = completedWeight + overdueWeight;
  const productivityScore = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  const lazyScore = totalWeight > 0 ? 100 - productivityScore : 0;

  return prisma.productivityLog.upsert({
    where: { userId_logDate: { userId, logDate: startOfDay } },
    update: {
      completedTasksCount: completedCount,
      overdueTasksCount: overdueCount,
      pendingTasksCount: pendingCount,
      productivityScore,
      lazyScore,
    },
    create: {
      userId,
      logDate: startOfDay,
      completedTasksCount: completedCount,
      overdueTasksCount: overdueCount,
      pendingTasksCount: pendingCount,
      productivityScore,
      lazyScore,
    },
  });
}
