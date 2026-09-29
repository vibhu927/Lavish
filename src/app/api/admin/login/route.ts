import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const user = await verifyAdmin(email, password);
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
