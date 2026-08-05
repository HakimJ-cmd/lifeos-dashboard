// Rate limiting sederhana in-memory (per proses). Cukup untuk single-user
// deployment pada free tier (satu instance). Untuk multi-instance, ganti
// dengan store eksternal (mis. Upstash Redis) tanpa mengubah pemanggilnya.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}

export function clientKeyFromRequest(req: Request) {
  // Di belakang proxy Fly.io, IP asli ada di x-forwarded-for.
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? "unknown";
}
