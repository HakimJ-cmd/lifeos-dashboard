import { cookies } from "next/headers";
import { prisma } from "./db";
import { signSessionToken, verifySessionToken } from "./session";

// Node-only (Prisma + cookies()). Importir dari API routes / server
// components saja — JANGAN diimpor dari middleware.ts. Untuk verifikasi
// token di Edge Runtime, impor langsung dari "./session".
export { signSessionToken, verifySessionToken };

const SESSION_COOKIE = "lifeos_session";

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 hari, selaras dengan expirationTime JWT
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

async function getSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

// Dipakai di semua halaman/route milik OWNER. Mengembalikan null (bukan
// throw) kalau yang login adalah client — supaya pemanggilnya tetap redirect
// ke /login seperti biasa, bukan bocor data owner ke client.
export async function getCurrentUser() {
  const session = await getSession();
  if (!session || session.role !== "owner") return null;
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, budgetLimit: true, avatarUrl: true },
  });
  return user;
}

// Dipakai di halaman/route milik CLIENT saja.
export async function getCurrentClient() {
  const session = await getSession();
  if (!session || session.role !== "client") return null;
  const client = await prisma.client.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true },
  });
  return client;
}
