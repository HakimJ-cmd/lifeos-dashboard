import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyGithubSignature } from "@/lib/github";

/**
 * Endpoint ini dipanggil oleh GitHub (bukan oleh browser/user), setiap kali
 * ada event "push" atau "issues" di repo yang di-setting webhook-nya.
 *
 * Setup di GitHub: Repo -> Settings -> Webhooks -> Add webhook
 *   Payload URL : https://<domain-project-kamu>/api/webhooks/github
 *   Content type: application/json
 *   Secret      : samakan dengan GITHUB_WEBHOOK_SECRET di .env
 *   Events      : pilih "Pushes" dan "Issues" saja (jangan "Send me everything")
 *
 * PENTING: di localhost, GitHub tidak bisa menjangkau URL ini sama sekali.
 * Perlu tunnel (ngrok/cloudflared) untuk testing lokal, atau setup ini
 * setelah deploy ke Fly.io.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    // Jangan bocorkan detail ke pengirim; cukup log di server.
    console.error("GITHUB_WEBHOOK_SECRET belum diset di .env");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  // WAJIB pakai raw body untuk verifikasi signature, bukan req.json() langsung.
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifyGithubSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = req.headers.get("x-github-event");
  const payload = JSON.parse(rawBody);
  const fullName: string | undefined = payload?.repository?.full_name; // format: "owner/repo"
  if (!fullName || !fullName.includes("/")) {
    return NextResponse.json({ ok: true }); // event tidak relevan, tetap balas 200 biar GitHub tidak retry terus
  }
  const [owner, repo] = fullName.split("/");

  const project = await prisma.project.findFirst({
    where: { githubOwner: owner, githubRepo: repo },
  });
  if (!project) {
    // Repo ini belum di-link ke proyek manapun — bukan error, cukup diamkan.
    return NextResponse.json({ ok: true });
  }

  if (event === "push") {
    const commitCount = Array.isArray(payload.commits) ? payload.commits.length : 0;
    await prisma.project.update({
      where: { id: project.id },
      data: {
        githubCommitCount: { increment: commitCount },
        githubLastSyncAt: new Date(),
      },
    });
  } else if (event === "issues") {
    const action = payload.action; // "opened" | "closed" | "reopened" | dst
    if (action === "opened") {
      await prisma.project.update({
        where: { id: project.id },
        data: { githubIssuesTotal: { increment: 1 }, githubLastSyncAt: new Date() },
      });
    } else if (action === "closed") {
      await prisma.project.update({
        where: { id: project.id },
        data: { githubIssuesClosed: { increment: 1 }, githubLastSyncAt: new Date() },
      });
    } else if (action === "reopened") {
      const current = await prisma.project.findUnique({ where: { id: project.id } });
      const nextClosed = Math.max(0, (current?.githubIssuesClosed ?? 1) - 1);
      await prisma.project.update({
        where: { id: project.id },
        data: { githubIssuesClosed: nextClosed, githubLastSyncAt: new Date() },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
