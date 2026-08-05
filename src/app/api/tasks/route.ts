import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { taskSchema } from "@/lib/validators";
import { recomputeTodayProductivity } from "@/lib/productivity";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const projectId = searchParams.get("projectId");

  const tasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      ...(status ? { status: status as any } : {}),
      ...(projectId ? { projectId } : {}),
    },
    include: { project: { select: { id: true, name: true } } },
    orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Kepemilikan proyek diverifikasi agar user tidak bisa menempel task ke
  // project milik user lain (IDOR protection) — relevan begitu multi-user
  // aktif di fase lanjutan.
  if (parsed.data.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, userId: user.id },
    });
    if (!project) {
      return NextResponse.json({ error: "Proyek tidak ditemukan." }, { status: 404 });
    }
  }

  const task = await prisma.task.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      projectId: parsed.data.projectId ?? null,
      status: parsed.data.status ?? "PENDING",
      priority: parsed.data.priority ?? "MEDIUM",
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
    },
  });

  await recomputeTodayProductivity(user.id);
  return NextResponse.json({ task }, { status: 201 });
}
