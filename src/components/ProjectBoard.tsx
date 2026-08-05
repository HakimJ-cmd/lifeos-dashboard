"use client";

import { useEffect, useState } from "react";

type Project = {
  id: string;
  name: string;
  description?: string | null;
  status: "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
  progress: number;
  taskCount: number;
  completedCount: number;
  githubOwner?: string | null;
  githubRepo?: string | null;
  githubCommitCount: number;
  githubIssuesTotal: number;
  githubIssuesClosed: number;
  githubLastSyncAt?: string | null;
  clientId?: string | null;
  client?: { id: string; name: string } | null;
};

type ClientOption = { id: string; name: string };

const STATUS_LABEL: Record<Project["status"], string> = {
  ACTIVE: "Aktif",
  ON_HOLD: "Ditunda",
  COMPLETED: "Selesai",
  ARCHIVED: "Arsip",
};

export function ProjectBoard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Form kecil untuk link/unlink repo GitHub, dibuka per-card.
  const [githubEditId, setGithubEditId] = useState<string | null>(null);
  const [githubOwnerInput, setGithubOwnerInput] = useState("");
  const [githubRepoInput, setGithubRepoInput] = useState("");

  async function load() {
    setLoading(true);
    const [projectsRes, clientsRes] = await Promise.all([
      fetch("/api/projects"),
      fetch("/api/clients"),
    ]);
    const projectsData = await projectsRes.json();
    const clientsData = await clientsRes.json();
    setProjects(projectsData.projects ?? []);
    setClientOptions((clientsData.clients ?? []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addProject(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || null }),
    });
    setName("");
    setDescription("");
    load();
  }

  async function updateStatus(id: string, status: Project["status"]) {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function assignClient(id: string, clientId: string) {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: clientId || null }),
    });
    load();
  }

  function openGithubForm(p: Project) {
    setGithubEditId(p.id);
    setGithubOwnerInput(p.githubOwner ?? "");
    setGithubRepoInput(p.githubRepo ?? "");
  }

  async function saveGithubLink(id: string) {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        githubOwner: githubOwnerInput.trim() || null,
        githubRepo: githubRepoInput.trim() || null,
      }),
    });
    setGithubEditId(null);
    load();
  }

  async function unlinkGithub(id: string) {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ githubOwner: null, githubRepo: null }),
    });
    load();
  }

  async function removeProject(id: string) {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <form onSubmit={addProject} className="bg-surface-container-lowest rounded-card shadow-card p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama proyek baru…"
          className="rounded-input border border-outline-variant px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Deskripsi singkat (opsional)"
          className="md:col-span-2 rounded-input border border-outline-variant px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        />
        <button type="submit" className="md:col-span-3 justify-self-start rounded-pill bg-primary text-on-primary text-sm font-medium px-5 py-2.5 shadow-pill hover:opacity-90 transition">
          Tambah Proyek
        </button>
      </form>

      {loading && <p className="text-sm text-on-surface-variant">Memuat…</p>}
      {!loading && projects.length === 0 && <p className="text-sm text-on-surface-variant">Belum ada proyek.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => {
          const issuePct = p.githubIssuesTotal > 0
            ? Math.round((p.githubIssuesClosed / p.githubIssuesTotal) * 100)
            : 0;
          const isLinked = !!(p.githubOwner && p.githubRepo);

          return (
            <div key={p.id} className="bg-surface-container-lowest rounded-card shadow-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display font-semibold text-base">{p.name}</h3>
                  <select
                    value={p.status}
                    onChange={(e) => updateStatus(p.id, e.target.value as Project["status"])}
                    className="inline-block text-xs font-medium bg-secondary-container text-on-secondary-container rounded-pill px-2 py-0.5 mt-1 border-none outline-none"
                  >
                    {Object.entries(STATUS_LABEL).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <button onClick={() => removeProject(p.id)} aria-label="Hapus proyek" className="text-on-surface-variant hover:text-error transition">
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>

              {p.description && <p className="text-sm text-on-surface-variant mb-4">{p.description}</p>}

              <div className="w-full h-2 bg-surface-container-high rounded-pill overflow-hidden mb-1.5">
                <div className="h-full bg-primary rounded-pill" style={{ width: `${p.progress}%` }} />
              </div>
              <p className="text-xs text-on-surface-variant mb-3">{p.completedCount}/{p.taskCount} tugas selesai · {p.progress}%</p>

              <div className="mb-3">
                <label className="text-[11px] text-on-surface-variant block mb-1">Client</label>
                <select
                  value={p.clientId ?? ""}
                  onChange={(e) => assignClient(p.id, e.target.value)}
                  className="w-full text-xs rounded-input border border-outline-variant px-2.5 py-1.5 outline-none focus:border-primary"
                >
                  <option value="">Tanpa client</option>
                  {clientOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* --- Integrasi GitHub --- */}
              {githubEditId === p.id ? (
                <div className="rounded-input border border-outline-variant p-3 space-y-2 bg-surface-container-low">
                  <input
                    value={githubOwnerInput}
                    onChange={(e) => setGithubOwnerInput(e.target.value)}
                    placeholder="owner (contoh: octocat)"
                    className="w-full rounded-input border border-outline-variant px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                  <input
                    value={githubRepoInput}
                    onChange={(e) => setGithubRepoInput(e.target.value)}
                    placeholder="nama-repo"
                    className="w-full rounded-input border border-outline-variant px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveGithubLink(p.id)}
                      className="rounded-pill bg-primary text-on-primary text-xs font-medium px-3 py-1.5"
                    >
                      Simpan
                    </button>
                    <button
                      onClick={() => setGithubEditId(null)}
                      className="rounded-pill bg-surface-container-high text-on-surface-variant text-xs font-medium px-3 py-1.5"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : isLinked ? (
                <div className="rounded-input border border-outline-variant p-3 bg-surface-container-low">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">
                      {p.githubOwner}/{p.githubRepo}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => openGithubForm(p)} className="text-xs text-primary underline">
                        Edit
                      </button>
                      <button onClick={() => unlinkGithub(p.id)} className="text-xs text-error underline">
                        Putuskan
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    {p.githubCommitCount} commit · {p.githubIssuesClosed}/{p.githubIssuesTotal} issue closed ({issuePct}%)
                  </p>
                  {p.githubLastSyncAt && (
                    <p className="text-[11px] text-on-surface-variant mt-1">
                      Sync terakhir: {new Date(p.githubLastSyncAt).toLocaleString("id-ID")}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => openGithubForm(p)}
                  className="text-xs text-primary underline"
                >
                  + Hubungkan repo GitHub
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
