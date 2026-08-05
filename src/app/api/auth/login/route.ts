import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signSessionToken, setSessionCookie } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validators";
import { rateLimit, clientKeyFromRequest } from "@/lib/security";

export async function POST(req: NextRequest) {
  // Brute-force protection: maks 8 percobaan / 5 menit per IP.
  const key = `login:${clientKeyFromRequest(req)}`;
  const rl = rateLimit(key, 8, 5 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan login. Coba lagi beberapa menit lagi." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Input tidak valid." }, { status: 400 });
  }

  const { email, password } = parsed.data;

  // Cek owner dulu, baru client. Email dijamin unik lintas kedua tabel di
  // level aplikasi (dicek saat membuat client baru), jadi tidak akan ambigu.
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && (await verifyPassword(password, user.passwordHash))) {
    const token = await signSessionToken(user.id, "owner");
    await setSessionCookie(token);
    return NextResponse.json({
      role: "owner",
      user: { id: user.id, name: user.name, email: user.email },
    });
  }

  const client = await prisma.client.findUnique({ where: { email } });
  if (client && (await verifyPassword(password, client.passwordHash))) {
    const token = await signSessionToken(client.id, "client");
    await setSessionCookie(token);
    return NextResponse.json({
      role: "client",
      user: { id: client.id, name: client.name, email: client.email },
    });
  }

  // Pesan error generik dengan sengaja disamakan untuk mencegah user
  // enumeration (menebak email mana yang terdaftar, dan apakah dia owner/client).
  return NextResponse.json({ error: "Email atau password salah." }, { status: 401 });
}
