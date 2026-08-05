import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { taskSchema } from "@/lib/validators";
import { recomputeTodayProductivity } from "@/lib/productivity";

async function ownedTask(userId: string, id: string) {
  return prisma.task.findFirst({ where: { id, userId } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await ownedTask(user.id, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = taskSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: any = { ...parsed.data };
  if (data.deadline) data.deadline = new Date(data.deadline);
  if (data.status === "COMPLETED" && existing.status !== "COMPLETED") {
    data.completedAt = new Date();
  }
  if (data.status && data.status !== "COMPLETED") {
    data.completedAt = null;
  }

  const task = await prisma.task.update({ where: { id }, data });
  await recomputeTodayProductivity(user.id);
  return NextResponse.json({ task });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await ownedTask(user.id, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.task.delete({ where: { id } });
  await recomputeTodayProductivity(user.id);
  return NextResponse.json({ ok: true });
}
