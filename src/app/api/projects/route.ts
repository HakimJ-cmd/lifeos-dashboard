import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { projectSchema } from "@/lib/validators";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    include: {
      tasks: { select: { id: true, status: true } },
      client: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // PROJ-3: persentase penyelesaian dihitung dari rasio task selesai.
  const withProgress = projects.map((p: (typeof projects)[number]) => {
    const total = p.tasks.length;
    const done = p.tasks.filter((t: (typeof p.tasks)[number]) => t.status === "COMPLETED").length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    const { tasks, ...rest } = p;
    return { ...rest, progress, taskCount: total, completedCount: done };
  });

  return NextResponse.json({ projects: withProgress });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      status: parsed.data.status ?? "ACTIVE",
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : null,
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
