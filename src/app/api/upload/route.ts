import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { UPLOAD_ROOT, localMediaStorage } from "@/lib/media";
import { publishDirtyContent } from "@/lib/github";
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
    // Publish the new file + its mediaAsset row to GitHub (no-op without
    // the token). Read the bytes back from disk so the commit holds exactly
    // what was saved, even if the local disk is an ephemeral overlay.
    const rel = url.replace(/^\/uploads\/?/, "");
    const target = path.resolve(UPLOAD_ROOT, rel);
    const root = path.resolve(UPLOAD_ROOT);
    if (target === root || !target.startsWith(root + path.sep)) {
      return NextResponse.json({ error: "Invalid upload path" }, { status: 400 });
    }
    const bytes = await fs.readFile(target);
    await publishDirtyContent(`cms: upload ${rel}`, [
      { path: `uploads/${rel}`, content: bytes },
    ]);
    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
