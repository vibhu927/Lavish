import { NextResponse } from "next/server";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { storeInfo } from "@/lib/db/store";
import { UPLOAD_ROOT } from "@/lib/media";
import { isAuthConfigured } from "@/lib/auth";

/**
 * Persistence diagnostics. This project publishes content via git push
 * (portfolio-style): edit on localhost, commit, push, Vercel rebuilds.
 * So on live Vercel, disk writes are EXPECTED to fail — that is normal and
 * not an error. This endpoint reports the setup on any machine.
 *
 * No auth on purpose: it exposes paths + writability only, never content.
 */
export async function GET() {
  const store = await storeInfo();

  let uploadWritable = false;
  let uploadError: string | undefined;
  try {
    await mkdir(UPLOAD_ROOT, { recursive: true });
    const probe = path.join(UPLOAD_ROOT, `.write-test.${process.pid}`);
    await writeFile(probe, "ok", "utf8");
    await unlink(probe);
    uploadWritable = true;
  } catch (e) {
    uploadError = e instanceof Error ? e.message : String(e);
  }

  const authConfigured = isAuthConfigured();
  const onEphemeralLive = !!store.ephemeralHost && !store.writable;
  // On live Vercel, read-only disk is by design (publish via git push).
  const ok = authConfigured && (store.writable || onEphemeralLive);
  return NextResponse.json(
    {
      ok,
      pid: process.pid,
      cwd: process.cwd(),
      nodeEnv: process.env.NODE_ENV,
      workflow: "publish-by-push (edit on localhost, commit + push)",
      dataWritable: store.writable,
      dataError: store.error,
      uploadWritable,
      uploadError,
      authConfigured,
      ephemeralHost: store.ephemeralHost,
      hint: !authConfigured
        ? "AUTH_SECRET is missing: add it in Vercel → Settings → Environment Variables, then redeploy."
        : onEphemeralLive
          ? "Live server is read-only as designed. To publish changes: edit on localhost:3000/admin, commit data/ + uploads/, push — Vercel rebuilds with the new content."
          : !store.writable
            ? "Disk is not writable and this does not look like serverless — check DATA_DIR and folder permissions."
            : undefined,
    },
    { status: ok ? 200 : 500 },
  );
}
