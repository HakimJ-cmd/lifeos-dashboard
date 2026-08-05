# LifeOS Dashboard — Personal Productivity & Financial Dashboard

Implementasi dari PRD "Personal Productivity & Financial Dashboard System" v0.1, dibangun sesuai
design system **Luminous SaaS** yang Anda sediakan (Plus Jakarta Sans + Inter, aksen ungu #5B53F0,
sidebar gelap, radius besar).

## Keputusan Teknis (penting dibaca)

PRD menyebut Laravel/PHP untuk backend. Sandbox pengembangan yang saya pakai tidak punya akses ke
Packagist (registry Composer), jadi saya membangun backend dan frontend dalam **satu aplikasi
Next.js 14 (App Router)** menggunakan API Routes + Prisma ORM, bukan Next.js + Laravel terpisah.
Manfaatnya untuk kasus Anda:
- Satu proses, satu container → konsumsi RAM lebih rendah, cocok untuk Fly.io free tier (256–512MB).
- Prisma ORM memberi proteksi SQL injection yang setara Eloquent, plus type-safety end-to-end.
- Tetap 100% kompatibel dengan requirement PRD: PostgreSQL, JWT session, deploy Docker ke Fly.io.

Jika Anda tetap ingin backend Laravel terpisah, skema database di `prisma/schema.prisma` bisa
dipakai sebagai referensi untuk membuat migration Laravel — strukturnya sudah 1:1 dengan Bab 8 PRD
(plus tabel `budget_categories` dan `sessions` tambahan).

## Fitur yang Sudah Diimplementasikan (sesuai Bab 6 PRD)

- **AUTH-1/2**: Login dengan bcrypt + sesi JWT di httpOnly cookie (setara Sanctum).
- **TASK-1/2/3**: CRUD tugas, status Pending/In Progress/Completed/Overdue, auto-flag overdue.
- **PROJ-1/2/3**: CRUD proyek, hubungkan tugas ke proyek, progress % otomatis.
- **FIN-1/2/3/4**: Catat transaksi, atur budget limit, warning otomatis saat ≥90% budget, rekap real-time.
- **PROD-1/2/3**: Skor produktivitas vs lazy score (berbobot prioritas tugas — menjawab pertanyaan
  terbuka Bab 12), bar chart interaktif, tabel historis 14 hari.

## Menjalankan di Lokal

```bash
npm install
cp .env.example .env      # lalu isi AUTH_SECRET dengan string acak (openssl rand -base64 32)
npx prisma migrate dev --name init
npm run seed               # membuat akun awal: you@example.com / ChangeMe123!
npm run dev
```

Buka http://localhost:3000, login dengan akun dari seed.

## Keamanan yang Diterapkan

- **Password**: bcrypt cost factor 12, tidak pernah disimpan plaintext.
- **Sesi**: JWT (HS256) di cookie `httpOnly`, `secure` (production), `sameSite=lax` — tidak bisa
  dibaca JavaScript sisi klien (mitigasi XSS token theft).
- **Rate limiting**: percobaan login dibatasi 8x/5 menit per IP (mitigasi brute-force).
- **Validasi input**: setiap API route memvalidasi body dengan Zod sebelum menyentuh database.
- **IDOR protection**: semua query database di-scope ke `userId` milik sesi aktif; task tidak bisa
  ditempel ke project yang bukan miliknya.
- **SQL Injection**: seluruh akses data lewat Prisma ORM (parameterized query), tidak ada raw SQL.
- **Security headers**: CSP, X-Frame-Options: DENY, HSTS, X-Content-Type-Options, Referrer-Policy
  (lihat `next.config.mjs`).
- **Error message login digeneralisasi** ("Email atau password salah") untuk mencegah user enumeration.

## Deploy ke Fly.io

```bash
fly launch --no-deploy          # pakai fly.toml yang sudah disediakan
fly secrets set AUTH_SECRET="$(openssl rand -base64 32)"
fly secrets set DATABASE_URL="postgresql://..."   # dari `fly postgres create` atau Neon/Supabase
fly deploy
```

Sebelum deploy production pertama kali, ubah `provider` di `prisma/schema.prisma` dari `"sqlite"`
menjadi `"postgresql"`, lalu jalankan `npx prisma migrate dev` sekali di lokal untuk membuat file
migrasi baru yang kompatibel Postgres.

## Struktur Folder

```
src/app/(dashboard)/   halaman: overview, tasks, projects, finance, productivity, settings
src/app/api/           API routes (auth, tasks, projects, finance, productivity, settings)
src/components/        komponen UI (Sidebar, TaskBoard, FinanceBoard, chart, dll.)
src/lib/                auth.ts, db.ts, security.ts, validators.ts, productivity.ts
prisma/schema.prisma    skema database
```
