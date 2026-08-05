import bcrypt from "bcryptjs";

// Dipisah dari auth.ts dengan sengaja: bcryptjs memakai Node.js API
// (process.nextTick/setImmediate) yang TIDAK didukung di Edge Runtime.
// middleware.ts berjalan di Edge dan hanya perlu verifySessionToken (jose),
// jadi ia harus mengimpor auth.ts TANPA menyeret modul ini ke bundle-nya.
// File ini hanya boleh diimpor dari API routes / server components (Node runtime).
export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}
