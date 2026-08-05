import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { TaskBoard } from "@/components/TaskBoard";

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Tugas &amp; Deadline</h1>
        <p className="text-on-surface-variant text-sm mt-1">Kelola pekerjaan harian dan lacak tenggat waktu.</p>
      </div>
      <TaskBoard projects={projects} />
    </div>
  );
}
