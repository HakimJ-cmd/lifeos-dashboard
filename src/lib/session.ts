import { SignJWT, jwtVerify } from "jose";

// Edge-safe: hanya "jose" (Web Crypto), tidak ada Prisma atau bcrypt.
// Aman diimpor dari middleware.ts (Edge Runtime) maupun dari auth.ts (Node).
const ALG = "HS256";

export type SessionRole = "owner" | "client";
export type SessionPayload = { id: string; role: SessionRole };

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Set a random string of at least 32 characters in .env"
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(id: string, role: SessionRole) {
  return new SignJWT({ sub: id, role })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const role = payload.role;
    if (role !== "owner" && role !== "client") return null; // token tidak valid/rusak
    return { id: payload.sub as string, role };
  } catch {
    return null;
  }
}
