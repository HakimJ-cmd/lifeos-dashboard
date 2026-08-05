import { ProjectBoard } from "@/components/ProjectBoard";

export default function ProjectsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Proyek</h1>
        <p className="text-on-surface-variant text-sm mt-1">Lacak progres setiap proyek pribadi Anda.</p>
      </div>
      <ProjectBoard />
    </div>
  );
}
