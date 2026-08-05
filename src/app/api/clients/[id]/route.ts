import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { clientUpdateSchema } from "@/lib/validators";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  // IDOR protection: scope ke userId sesi aktif, bukan cuma ke id dari URL.
  const existing = await prisma.client.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = clientUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (parsed.data.email && parsed.data.email !== existing.email) {
    const emailTaken =
      (await prisma.client.findUnique({ where: { email: parsed.data.email } })) ||
      (await prisma.user.findUnique({ where: { email: parsed.data.email } }));
    if (emailTaken) return NextResponse.json({ error: "Email ini sudah dipakai." }, { status: 409 });
  }

  const data: Record<string, unknown> = {
    name: parsed.data.name,
    email: parsed.data.email,
  };
  if (parsed.data.password) {
    data.passwordHash = await hashPassword(parsed.data.password);
  }

  const client = await prisma.client.update({ where: { id }, data });
  const { passwordHash: _omit, ...safe } = client;
  return NextResponse.json({ client: safe });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.client.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // onDelete: SetNull di schema — project yang tadinya milik client ini
  // TIDAK ikut terhapus, cuma dilepas (clientId jadi null).
  await prisma.client.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
