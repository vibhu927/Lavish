import { NextRequest, NextResponse } from "next/server";
import { localMediaStorage } from "@/lib/media";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const folder = (form.get("folder") as string) || "general";
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  try {
    const { url } = await localMediaStorage.save(file, folder);
    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
