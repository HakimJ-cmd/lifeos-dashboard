import crypto from "crypto";

/**
 * Verifikasi header X-Hub-Signature-256 yang dikirim GitHub di setiap
 * webhook request. Wajib dicek supaya endpoint /api/webhooks/github tidak
 * bisa dipanggil sembarang orang untuk memalsukan progress proyek.
 *
 * GitHub menghitung signature dari RAW body (sebelum di-parse jadi JSON),
 * jadi `rawBody` di sini harus string mentah, bukan hasil JSON.stringify ulang.
 */
export function verifyGithubSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;

  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  // Panjang harus sama dulu sebelum timingSafeEqual, kalau tidak dia throw.
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}
