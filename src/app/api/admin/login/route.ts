import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const user = await verifyAdmin(email, password);
    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin login failed:", err);
    if (err instanceof Error && err.message.includes("AUTH_SECRET")) {
      return NextResponse.json(
        { error: "Server misconfigured: AUTH_SECRET is not set. Add it in Vercel → Settings → Environment Variables, then redeploy." },
        { status: 500 },
      );
    }
    const message = err instanceof Error && err.message.includes("does not exist")
      ? "Database is not set up on this server."
      : "Login service unavailable. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
