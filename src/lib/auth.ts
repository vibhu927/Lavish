import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const SESSION_COOKIE = "leaf_admin_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function verifyAdmin(email: string, password: string) {
  const user = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return user;
}

export async function createSession(userId: string) {
  const token = Buffer.from(`${userId}:${Date.now()}:${Math.random()}`).toString("base64url");
  // store token as simple cookie value; validate by lookup
  // For file-only demo we store session in cookie as userId|token and validate existence
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, `${userId}.${token}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
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
  const [userId] = val.split(".");
  if (!userId) return null;
  const user = await prisma.adminUser.findUnique({ where: { id: userId } });
  return user;
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export const authConfig = { sessionCookie: SESSION_COOKIE };
