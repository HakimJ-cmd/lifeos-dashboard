import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { clientSchema } from "@/lib/validators";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clients = await prisma.client.findMany({
    where: { userId: user.id },
    include: { projects: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Jangan pernah kirim passwordHash ke frontend.
  const safe = clients.map(({ passwordHash, ...rest }) => rest);
  return NextResponse.json({ clients: safe });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Email harus unik lintas Client (dan idealnya juga lintas User) supaya
  // login tidak ambigu.
  const existingClient = await prisma.client.findUnique({ where: { email: parsed.data.email } });
  const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existingClient || existingUser) {
    return NextResponse.json({ error: "Email ini sudah dipakai." }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const client = await prisma.client.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
    },
  });

  const { passwordHash: _omit, ...safe } = client;
  return NextResponse.json({ client: safe }, { status: 201 });
}
