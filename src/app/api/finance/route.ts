import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { transactionSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id, ...(type ? { type: type as any } : {}) },
    include: { category: { select: { id: true, name: true } } },
    orderBy: { transactionDate: "desc" },
    take: 200,
  });

  return NextResponse.json({ transactions });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.categoryId) {
    const cat = await prisma.budgetCategory.findFirst({
      where: { id: parsed.data.categoryId, userId: user.id },
    });
    if (!cat) return NextResponse.json({ error: "Kategori tidak ditemukan." }, { status: 404 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId: user.id,
      type: parsed.data.type,
      amount: parsed.data.amount,
      transactionDate: new Date(parsed.data.transactionDate),
      categoryId: parsed.data.categoryId ?? null,
      notes: parsed.data.notes ?? null,
    },
  });

  return NextResponse.json({ transaction }, { status: 201 });
}
