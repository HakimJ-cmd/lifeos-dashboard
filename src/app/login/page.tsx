"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal masuk.");
        return;
      }
      router.push(data.role === "client" ? "/client/progress" : "/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-surface-container-lowest rounded-card shadow-card p-8">
        <div className="mb-8">
          <div className="w-11 h-11 rounded-input bg-primary flex items-center justify-center text-on-primary font-display font-bold text-lg mb-4">
            L
          </div>
          <h1 className="font-display text-2xl font-bold text-on-surface">Masuk ke LifeOS</h1>
          <p className="text-on-surface-variant text-sm mt-1">Dashboard produktivitas &amp; keuangan pribadi Anda.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-on-surface-variant mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-input border border-outline-variant px-3.5 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              placeholder="anda@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-on-surface-variant mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-input border border-outline-variant px-3.5 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-error bg-error-container/40 rounded-input px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-pill bg-primary text-on-primary font-medium text-sm py-2.5 shadow-pill hover:opacity-90 disabled:opacity-60 transition"
          >
            {loading ? "Memproses…" : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
