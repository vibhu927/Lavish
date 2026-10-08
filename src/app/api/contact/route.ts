import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validations";
import { publishDirtyContent } from "@/lib/github";

// simple in-memory rate limit
const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  if (arr.length >= 5) return true;
  arr.push(now);
  hits.set(ip, arr);
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  if (rateLimited(ip)) return NextResponse.json({ error: "Too many requests. Try later." }, { status: 429 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  // NOTE: on live Vercel the local disk is read-only/ephemeral. With GitHub
  // auto-publish configured the enquiry is committed to the repo (and goes
  // live on redeploy); otherwise it fails loudly instead of vanishing.
  try {
    const sub = await prisma.contactSubmission.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        subject: parsed.data.subject,
        message: parsed.data.message,
        productId: parsed.data.productId,
        status: "NEW",
      },
    });
    await publishDirtyContent(`cms: new enquiry from ${parsed.data.name}`);
    return NextResponse.json({ ok: true, id: sub.id });
  } catch (e) {
    console.error("contact submission failed:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "Could not save your enquiry online. Please reach us on WhatsApp or phone instead." },
      { status: 503 },
    );
  }
}
