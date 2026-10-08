import { NextResponse } from "next/server";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { storeInfo } from "@/lib/db/store";
import { UPLOAD_ROOT } from "@/lib/media";
import { isAuthConfigured } from "@/lib/auth";
import { isGitHubSyncEnabled } from "@/lib/github";

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
  const githubSync = isGitHubSyncEnabled();
  // Live writes work only via GitHub auto-publish; without it the live disk
  // is read-only by design (publish via localhost + git push instead).
  const liveWritesWork = store.writable || githubSync;
  const ok = authConfigured && (store.writable || !!store.ephemeralHost);
  return NextResponse.json(
    {
      ok,
      pid: process.pid,
      cwd: process.cwd(),
      nodeEnv: process.env.NODE_ENV,
      workflow: githubSync
        ? "auto-publish (live saves commit to GitHub, Vercel redeploys)"
        : "publish-by-push (edit on localhost, commit + push)",
      dataWritable: store.writable,
      dataError: store.error,
      uploadWritable,
      uploadError,
      authConfigured,
      githubSync,
      liveWritesWork,
      ephemeralHost: store.ephemeralHost,
      hint: !authConfigured
        ? "AUTH_SECRET is missing: add it in Vercel → Settings → Environment Variables, then redeploy."
        : !liveWritesWork
          ? "Live saving is OFF: either set GITHUB_TOKEN + GITHUB_REPO (auto-publish, see README) or edit on localhost:3000/admin, commit data/ + uploads/, push."
          : undefined,
    },
    { status: ok ? 200 : 500 },
  );
}
