import { NextResponse } from "next/server";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { storeInfo } from "@/lib/db/store";
import { UPLOAD_ROOT } from "@/lib/media";

/**
 * Persistence diagnostics. Hit /api/health on live when "nothing saves":
 * it tells you WHERE the app thinks data/ + uploads/ live, whether the
 * process can actually write there, and whether you're on an ephemeral
 * (serverless) host where JSON files can never persist.
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

  const ok = store.writable && uploadWritable;
  return NextResponse.json(
    {
      ok,
      pid: process.pid,
      cwd: process.cwd(),
      nodeEnv: process.env.NODE_ENV,
      dataDir: store.dataDir,
      dataWritable: store.writable,
      dataError: store.error,
      uploadDir: UPLOAD_ROOT,
      uploadWritable,
      uploadError,
      ephemeralHost: store.ephemeralHost,
      hint: !ok
        ? "Writes will look successful then vanish on refresh when the data/upload dir is not writable or lives on an ephemeral filesystem (Vercel/Lambda = always ephemeral). On your VPS, point DATA_DIR/UPLOAD_DIR at a persistent absolute path and ensure the service user owns it."
        : undefined,
    },
    { status: ok ? 200 : 500 },
  );
}
