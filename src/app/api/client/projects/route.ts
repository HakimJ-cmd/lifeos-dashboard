import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentClient } from "@/lib/auth";

// Read-only dengan sengaja: cuma GET, tidak ada POST/PATCH/DELETE di sini.
// Client TIDAK BOLEH bisa mengubah status atau apa pun lewat endpoint ini.
export async function GET() {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // IDOR protection: filter SELALU dari client.id hasil verifikasi sesi,
  // tidak pernah dari parameter yang dikirim client (tidak ada parameter
  // sama sekali di endpoint ini, justru supaya tidak ada apa pun yang bisa
  // dimanipulasi untuk melihat data client lain).
  const projects = await prisma.project.findMany({
    where: { clientId: client.id },
    include: { tasks: { select: { status: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Sesuai keputusan produk: client cuma boleh lihat nama, status, dan
  // persentase progress — TIDAK ada deskripsi, tugas detail, data GitHub,
  // atau apa pun yang lebih rinci dari itu.
  const result = projects.map((p: (typeof projects)[number]) => {
    const total = p.tasks.length;
    const done = p.tasks.filter((t: (typeof p.tasks)[number]) => t.status === "COMPLETED").length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    return { id: p.id, name: p.name, status: p.status, progress };
  });

  return NextResponse.json({ projects: result });
}
