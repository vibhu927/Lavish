import { createHash } from "crypto";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { prisma } from "./prisma";

export interface MediaStorage {
  save(file: File, folder?: string): Promise<{ url: string; hash: string }>;
  delete(url: string): Promise<void>;
}

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/jpg"]);
const MAX_BYTES = 4.5 * 1024 * 1024; // Vercel payload limit

export const localMediaStorage: MediaStorage = {
  async save(file: File, folder = "general") {
    if (!ALLOWED.has(file.type)) throw new Error(`Invalid file type: ${file.type}`);
    if (file.size > MAX_BYTES) throw new Error(`File too large (max 4.5MB)`);
    const buffer = Buffer.from(await file.arrayBuffer());
    const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 16);

    // dedup: check existing asset by hash
    const existing = await prisma.mediaAsset.findFirst({ where: { hash } });
    if (existing) return { url: existing.url, hash };

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 40);
    const dir = path.join(UPLOAD_ROOT, folder);
    await mkdir(dir, { recursive: true });
    const filename = `${hash}-${Date.now()}-${safeName}`;
    const filepath = path.join(dir, filename);
    await writeFile(filepath, buffer);
    const url = `/uploads/${folder}/${filename}`;
    await prisma.mediaAsset.create({
      data: { url, filename, mimeType: file.type, size: file.size, hash },
    });
    return { url, hash };
  },
  async delete(url: string) {
    // only delete if no other refs? For now just remove file + row.
    const asset = await prisma.mediaAsset.findFirst({ where: { url } });
    if (!asset) return;
    const filepath = path.join(process.cwd(), "public", url.replace(/^\//, ""));
    try {
      await unlink(filepath);
    } catch {}
    await prisma.mediaAsset.delete({ where: { id: asset.id } }).catch(() => {});
  },
};
