import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";

const SESSION_COOKIE = "leaf_admin_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error("AUTH_SECRET must be set (16+ chars). Add it to .env on the server.");
  }
  return value;
}

/** HMAC over the payload, so a cookie cannot be forged without the server secret. */
function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function verifyAdmin(email: string, password: string) {
  const user = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return user;
}

export async function createSession(userId: string) {
  const expiresAt = Date.now() + MAX_AGE * 1000;
  const payload = `${userId}.${expiresAt}`;
  const value = `${payload}.${sign(payload)}`;

  // A `Secure` cookie is silently dropped over plain HTTP, which would send
  // the admin straight back to the login form, so key it off the real protocol.
  const h = await headers();
  const isHttps = h.get("x-forwarded-proto") === "https";

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const val = cookieStore.get(SESSION_COOKIE)?.value;
  if (!val) return null;

  const parts = val.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresAt, signature] = parts;

  if (!safeEqual(signature, sign(`${userId}.${expiresAt}`))) return null;
  if (!Number.isFinite(Number(expiresAt)) || Number(expiresAt) < Date.now()) return null;

  return prisma.adminUser.findUnique({ where: { id: userId } });
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export const authConfig = { sessionCookie: SESSION_COOKIE };
