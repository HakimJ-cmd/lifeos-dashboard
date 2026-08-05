"use client";

import { useEffect, useState } from "react";

type ClientProject = {
  id: string;
  name: string;
  status: "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
  progress: number;
};

const STATUS_LABEL: Record<ClientProject["status"], string> = {
  ACTIVE: "Aktif",
  ON_HOLD: "Ditunda",
  COMPLETED: "Selesai",
  ARCHIVED: "Arsip",
};

const STATUS_STYLE: Record<ClientProject["status"], string> = {
  ACTIVE: "bg-secondary-container text-on-secondary-container",
  ON_HOLD: "bg-surface-container-high text-on-surface-variant",
  COMPLETED: "bg-success-container text-success",
  ARCHIVED: "bg-surface-container-high text-on-surface-variant",
};

export function ClientProgressBoard() {
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/client/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data.projects ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-on-surface-variant">Memuat…</p>;

  if (projects.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant">
        Belum ada proyek yang ditautkan ke akun Anda. Hubungi kami kalau ini seharusnya sudah ada.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((p) => (
        <div key={p.id} className="bg-surface-container-lowest rounded-card shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-base">{p.name}</h3>
            <span className={`text-xs font-medium rounded-pill px-2.5 py-1 ${STATUS_STYLE[p.status]}`}>
              {STATUS_LABEL[p.status]}
            </span>
          </div>
          <div className="w-full h-2.5 bg-surface-container-high rounded-pill overflow-hidden mb-1.5">
            <div className="h-full bg-primary rounded-pill" style={{ width: `${p.progress}%` }} />
          </div>
          <p className="text-xs text-on-surface-variant">{p.progress}% selesai</p>
        </div>
      ))}
    </div>
  );
}
