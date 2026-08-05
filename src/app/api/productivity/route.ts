import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { recomputeTodayProductivity } from "@/lib/productivity";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await recomputeTodayProductivity(user.id);

  const logs = await prisma.productivityLog.findMany({
    where: { userId: user.id },
    orderBy: { logDate: "desc" },
    take: 30,
  });

  return NextResponse.json({ logs: logs.reverse() });
}
