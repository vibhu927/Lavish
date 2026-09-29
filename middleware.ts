import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  // Protect admin routes except login
  if (path.startsWith("/admin") && !path.startsWith("/admin/login")) {
    const session = req.cookies.get("leaf_admin_session")?.value;
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }
  // If logged in and hitting login, redirect to dashboard
  if (path === "/admin/login") {
    const session = req.cookies.get("leaf_admin_session")?.value;
    if (session) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }
  // Hide blogs if disabled? Handled in page, not middleware (needs DB)
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
