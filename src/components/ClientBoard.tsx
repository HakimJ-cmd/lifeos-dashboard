"use client";

import { useEffect, useState } from "react";

type ClientItem = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  projects: { id: string; name: string }[];
};

export function ClientBoard() {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/clients");
    const data = await res.json();
    setClients(data.clients ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addClient(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || password.length < 8) {
      setError("Nama, email wajib diisi, dan password minimal 8 karakter.");
      return;
    }
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Gagal menambah client.");
      return;
    }
    setName("");
    setEmail("");
    setPassword("");
    load();
  }

  function openEdit(c: ClientItem) {
    setEditId(c.id);
    setEditName(c.name);
    setEditEmail(c.email);
    setEditPassword("");
    setEditError(null);
  }

  async function saveEdit() {
    if (!editId) return;
    setEditError(null);
    const body: Record<string, string> = { name: editName, email: editEmail };
    if (editPassword) body.password = editPassword;
    const res = await fetch(`/api/clients/${editId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setEditError(typeof data.error === "string" ? data.error : "Gagal menyimpan.");
      return;
    }
    setEditId(null);
    load();
  }

  async function removeClient(id: string) {
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <form onSubmit={addClient} className="bg-surface-container-lowest rounded-card shadow-card p-5 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama client…"
          className="rounded-input border border-outline-variant px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email login client"
          className="rounded-input border border-outline-variant px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="text"
          placeholder="Password (min. 8 karakter)"
          className="rounded-input border border-outline-variant px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        />
        <button type="submit" className="rounded-pill bg-primary text-on-primary text-sm font-medium px-5 py-2.5 shadow-pill hover:opacity-90 transition">
          Tambah Client
        </button>
        {error && <p className="md:col-span-4 text-sm text-error">{error}</p>}
        <p className="md:col-span-4 text-xs text-on-surface-variant">
          Password di atas tampil sebagai teks biasa (bukan disamarkan) supaya kamu bisa langsung salin &amp; kirim ke client — pastikan mengetiknya di tempat yang tidak dilihat orang lain.
        </p>
      </form>

      {loading && <p className="text-sm text-on-surface-variant">Memuat…</p>}
      {!loading && clients.length === 0 && <p className="text-sm text-on-surface-variant">Belum ada client.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((c) => (
          <div key={c.id} className="bg-surface-container-lowest rounded-card shadow-card p-5">
            {editId === c.id ? (
              <div className="space-y-2">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-input border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="Nama"
                />
                <input
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  type="email"
                  className="w-full rounded-input border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="Email"
                />
                <input
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full rounded-input border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="Password baru (kosongkan jika tidak diubah)"
                />
                {editError && <p className="text-sm text-error">{editError}</p>}
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="rounded-pill bg-primary text-on-primary text-xs font-medium px-3 py-1.5">
                    Simpan
                  </button>
                  <button onClick={() => setEditId(null)} className="rounded-pill bg-surface-container-high text-on-surface-variant text-xs font-medium px-3 py-1.5">
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-display font-semibold text-base">{c.name}</h3>
                    <p className="text-xs text-on-surface-variant">{c.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(c)} aria-label="Edit client" className="text-on-surface-variant hover:text-primary transition">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button onClick={() => removeClient(c.id)} aria-label="Hapus client" className="text-on-surface-variant hover:text-error transition">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant">
                  {c.projects.length === 0
                    ? "Belum ada proyek terhubung."
                    : `Proyek: ${c.projects.map((p) => p.name).join(", ")}`}
                </p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
