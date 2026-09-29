import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { UPLOAD_ROOT } from "@/lib/media";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

/**
 * Uploads live outside `public/` on purpose: Next.js snapshots `public/` when
 * the server boots, so anything written later 404s until restart. Streaming
 * from disk here means a file is available the moment it is uploaded.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path: segments } = await params;
  const rel = (segments ?? []).join("/");
  if (!rel) return new NextResponse("Not found", { status: 404 });

  // Reject traversal before touching the filesystem.
  const target = path.resolve(UPLOAD_ROOT, rel);
  const root = path.resolve(UPLOAD_ROOT);
  if (target !== root && !target.startsWith(root + path.sep)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let data: Buffer;
  try {
    data = await fs.readFile(target);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const type = MIME[path.extname(target).toLowerCase()];
  if (!type) return new NextResponse("Unsupported type", { status: 415 });

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": type,
      "Content-Length": String(data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
