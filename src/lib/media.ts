import { createHash } from "crypto";
import { mkdir, unlink, open, stat } from "fs/promises";
import path from "path";
import { prisma } from "./prisma";
import { isGitHubSyncEnabled } from "./github";
import { setCachedRows, withDefaults, type Row } from "./db/store";

/** On live Vercel without auto-publish, point the error at the fix. */
function liveHint(): string {
  if (process.env.VERCEL && !isGitHubSyncEnabled()) {
    return " Live uploads need GitHub auto-publish (set GITHUB_TOKEN + GITHUB_REPO on Vercel, see README) — or upload on localhost and push.";
  }
  return "";
}

export interface MediaStorage {
  save(file: File, folder?: string): Promise<{ url: string; hash: string; published?: boolean }>;
  delete(url: string): Promise<void>;
}

// Kept outside public/ so Next.js does not snapshot uploads at boot.
export const UPLOAD_ROOT = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), "uploads");

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/jpg"]);
const MAX_BYTES = 4.5 * 1024 * 1024; // request body limit on a small VPS

function safeSegment(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!cleaned || cleaned === "." || cleaned === "..") {
    throw new Error("Invalid upload name");
  }
  return cleaned.slice(0, 40);
}

export const localMediaStorage: MediaStorage = {
  async save(file: File, folder = "general") {
    if (!ALLOWED.has(file.type)) throw new Error(`Invalid file type: ${file.type}`);
    if (file.size > MAX_BYTES) throw new Error(`File too large (max 4.5MB)`);

    const buffer = Buffer.from(await file.arrayBuffer());
    const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 16);

    // dedup: reuse the existing asset when the bytes are identical
    const existing = await prisma.mediaAsset.findFirst({ where: { hash } });
    if (existing) return { url: existing.url, hash };

    const safeFolder = safeSegment(folder);
    const safeName = safeSegment(file.name);
    const filename = `${hash}-${Date.now()}-${safeName}`;

    const dir = path.join(UPLOAD_ROOT, safeFolder);
    const url = `/uploads/${safeFolder}/${filename}`;
    const rel = `${safeFolder}/${filename}`;
    try {
      await mkdir(dir, { recursive: true });
      const dest = path.join(dir, filename);
      const handle = await open(dest, "w");
      try {
        await handle.writeFile(buffer);
        await handle.sync(); // flush bytes so a refresh right after upload sees them
      } finally {
        await handle.close();
      }
      // Verify the file actually landed on disk before recording it in the DB.
      const st = await stat(dest);
      if (st.size !== buffer.length) {
        throw new Error(`size mismatch after write (expected ${buffer.length}, got ${st.size})`);
      }
    } catch (e) {
      // Strictly read-only live disk (e.g. Vercel /var/task) WITH auto-publish:
      // the bytes can never land locally, so publish file + library row
      // straight from memory. The redeploy then serves the image.
      if (isGitHubSyncEnabled()) {
        const row = withDefaults("mediaAsset", {
          url,
          filename,
          mimeType: file.type,
          size: file.size,
          hash,
        }) as Row;
        const current = (await prisma.mediaAsset.findMany()) as Row[];
        const { pushFilesToGitHub } = await import("./github");
        await pushFilesToGitHub(
          [
            { path: "data/mediaAsset.json", content: `${JSON.stringify([...current, row], null, 2)}\n` },
            { path: `uploads/${rel}`, content: buffer },
          ],
          [],
          `cms: upload ${rel} (live)`,
        );
        await setCachedRows("mediaAsset", [...current, row]);
        return { url, hash, published: true };
      }
      const dest = path.join(dir, filename);
      throw new Error(
        `Cannot write upload ${dest} (cwd=${process.cwd()} UPLOAD_DIR=${UPLOAD_ROOT}): ${e instanceof Error ? e.message : String(e)}.${liveHint()}`,
      );
    }

    await prisma.mediaAsset.create({
      data: { url, filename, mimeType: file.type, size: file.size, hash },
    });
    return { url, hash };
  },

  async delete(url: string) {
    const asset = await prisma.mediaAsset.findFirst({ where: { url } });
    if (!asset) return;
    const rel = url.replace(/^\/uploads\/?/, "");
    const target = path.resolve(UPLOAD_ROOT, rel);
    const root = path.resolve(UPLOAD_ROOT);
    if (target.startsWith(root + path.sep)) {
      try {
        await unlink(target);
      } catch {}
    }
    await prisma.mediaAsset.delete({ where: { id: asset.id } }).catch(() => {});
  },
};
