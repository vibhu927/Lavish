import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "leaf_admin_session";

/**
 * The old code redirected /admin/login → /admin on cookie PRESENCE alone.
 * After setting/changing AUTH_SECRET (or deleting the admin user), the
 * browser holds a cookie whose signature no longer verifies: the middleware
 * bounced login → admin, the page bounced admin → login, forever
 * (browser shows "can't open the page" / too many redirects).
 *
 * Now the middleware verifies the HMAC signature itself (WebCrypto only, so
 * it runs on Edge and Node) and clears dead cookies instead of looping.
 */
async function sessionLooksValid(val: string | undefined): Promise<boolean> {
  try {
    const secret = process.env.AUTH_SECRET;
    if (!val || !secret || secret.length < 16) return false;
    const parts = val.split(".");
    if (parts.length !== 3) return false;
    const [userId, expiresAt, signature] = parts;
    if (!Number.isFinite(Number(expiresAt)) || Number(expiresAt) < Date.now()) return false;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sigBytes = new Uint8Array(
      await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${userId}.${expiresAt}`)),
    );
    let binary = "";
    for (const b of sigBytes) binary += String.fromCharCode(b);
    const expected = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    if (expected.length !== signature.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const session = req.cookies.get(SESSION_COOKIE)?.value;

  // Protect admin routes except login (presence check is enough here —
  // the page itself validates the session and redirects when invalid).
  if (path.startsWith("/admin") && !path.startsWith("/admin/login")) {
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.next();
  }

  // Visiting login with a VALID session → dashboard. A stale/invalid
  // cookie shows the form (and gets cleared) instead of looping.
  if (path === "/admin/login") {
    if (session && (await sessionLooksValid(session))) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (session) {
      const res = NextResponse.next();
      res.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
      return res;
    }
  }

  // Hide blogs if disabled? Handled in page, not middleware (needs DB)
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
