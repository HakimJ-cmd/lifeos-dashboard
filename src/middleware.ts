import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";

// "/api/webhooks/github" dikecualikan karena dipanggil oleh server GitHub
// (tidak punya cookie sesi kita) — keamanannya dijaga oleh verifikasi
// signature HMAC di dalam route itu sendiri, bukan oleh middleware ini.
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/webhooks/github"];

// Semua path yang boleh diakses akun CLIENT. Sengaja whitelist (bukan
// blacklist) supaya kalau nanti ada halaman/route baru ditambah, defaultnya
// otomatis TERTUTUP untuk client sampai eksplisit ditambahkan di sini.
const CLIENT_ALLOWED_PATHS = ["/client/progress", "/api/client/projects", "/api/auth/logout"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p) || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("lifeos_session")?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (session.role === "client" && !CLIENT_ALLOWED_PATHS.some((p) => pathname === p)) {
    // Client mencoba akses halaman/route yang bukan haknya — tolak, JANGAN
    // arahkan ke dashboard owner sama sekali.
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/client/progress", req.url));
  }

  if (session.role === "owner" && CLIENT_ALLOWED_PATHS.some((p) => pathname === p)) {
    // Owner tidak perlu (dan tidak boleh sembarang) memakai jalur khusus client.
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
