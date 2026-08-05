"use client";

import { useEffect, useState } from "react";

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  deadline?: string | null;
  project?: { id: string; name: string } | null;
};

type Project = { id: string; name: string };

const STATUS_LABEL: Record<Task["status"], string> = {
  PENDING: "Menunggu",
  IN_PROGRESS: "Berjalan",
  COMPLETED: "Selesai",
  OVERDUE: "Terlambat",
};

const STATUS_STYLE: Record<Task["status"], string> = {
  PENDING: "bg-surface-container text-on-surface-variant",
  IN_PROGRESS: "bg-secondary-container text-on-secondary-container",
  COMPLETED: "bg-success-container text-success",
  OVERDUE: "bg-error-container text-on-error-container",
};

export function TaskBoard({ projects }: { projects: Project[] }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("MEDIUM");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data.tasks ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        priority,
        projectId: projectId || null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      }),
    });
    if (!res.ok) {
      setError("Gagal menambah tugas.");
      return;
    }
    setTitle("");
    setDeadline("");
    setProjectId("");
    load();
  }

  async function updateStatus(id: string, status: Task["status"]) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function removeTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <form onSubmit={addTask} className="bg-surface-container-lowest rounded-card shadow-card p-5 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nama tugas baru…"
          className="md:col-span-2 rounded-input border border-outline-variant px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        />
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="rounded-input border border-outline-variant px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="">Tanpa proyek</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Task["priority"])}
          className="rounded-input border border-outline-variant px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="LOW">Prioritas rendah</option>
          <option value="MEDIUM">Prioritas sedang</option>
          <option value="HIGH">Prioritas tinggi</option>
        </select>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="rounded-input border border-outline-variant px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        />
        <button type="submit" className="md:col-span-5 justify-self-start rounded-pill bg-primary text-on-primary text-sm font-medium px-5 py-2.5 shadow-pill hover:opacity-90 transition">
          Tambah Tugas
        </button>
        {error && <p className="md:col-span-5 text-sm text-error">{error}</p>}
      </form>

      <div className="bg-surface-container-lowest rounded-card shadow-card divide-y divide-outline-variant/40">
        {loading && <p className="p-5 text-sm text-on-surface-variant">Memuat…</p>}
        {!loading && tasks.length === 0 && <p className="p-5 text-sm text-on-surface-variant">Belum ada tugas.</p>}
        {tasks.map((t) => (
          <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="text-sm font-medium">{t.title}</p>
              <p className="text-xs text-on-surface-variant">
                {t.project?.name ?? "Tanpa proyek"}
                {t.deadline ? ` · ${new Date(t.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={t.status}
                onChange={(e) => updateStatus(t.id, e.target.value as Task["status"])}
                className={`text-xs font-medium rounded-pill px-2.5 py-1.5 border-none outline-none ${STATUS_STYLE[t.status]}`}
              >
                {Object.entries(STATUS_LABEL).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <button onClick={() => removeTask(t.id)} aria-label="Hapus tugas" className="text-on-surface-variant hover:text-error transition">
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
