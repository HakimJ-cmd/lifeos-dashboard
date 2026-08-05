import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_EMAIL || "you@example.com";
  const password = process.env.SEED_PASSWORD || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "Pemilik Dashboard",
      email,
      passwordHash,
      budgetLimit: 3_000_000,
    },
  });

  const project = await prisma.project.upsert({
    where: { id: "seed-project-1" },
    update: {},
    create: {
      id: "seed-project-1",
      userId: user.id,
      name: "Skripsi & Riset",
      description: "Menyelesaikan penulisan skripsi tepat waktu.",
      status: "ACTIVE",
      startDate: new Date(),
    },
  });

  await prisma.task.createMany({
    data: [
      { userId: user.id, projectId: project.id, title: "Revisi BAB IV", priority: "HIGH", status: "IN_PROGRESS", deadline: new Date(Date.now() + 3 * 86400000) },
      { userId: user.id, projectId: project.id, title: "Kumpulkan referensi jurnal", priority: "MEDIUM", status: "PENDING", deadline: new Date(Date.now() + 7 * 86400000) },
      { userId: user.id, title: "Bayar tagihan internet", priority: "LOW", status: "COMPLETED", completedAt: new Date() },
    ],
    skipDuplicates: true,
  });

  await prisma.transaction.createMany({
    data: [
      { userId: user.id, type: "INCOME", amount: 2_500_000, transactionDate: new Date(), notes: "Uang saku bulanan" },
      { userId: user.id, type: "EXPENSE", amount: 450_000, transactionDate: new Date(), notes: "Belanja bulanan" },
    ],
  });

  console.log(`Seed selesai. Login dengan: ${email} / ${password}`);
}

main().finally(() => prisma.$disconnect());
