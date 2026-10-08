import { promises as fs } from "fs";
import path from "path";
import { modelDef, newId } from "./models";

export type Row = Record<string, unknown>;

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

function fileFor(model: string): string {
  return path.join(DATA_DIR, `${model}.json`);
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

/* ------------------------------------------------------------------ *
 * Read path: parse once per model, re-read when the file's mtime moves.
 * ------------------------------------------------------------------ */

type CacheEntry = { mtimeMs: number; size: number; rows: Row[] };
const cache = new Map<string, CacheEntry>();

/** Shallow-clone rows so callers can never mutate the cached copy. */
function cloneRows(rows: Row[]): Row[] {
  return rows.map((r) => ({ ...r }));
}

export async function readAll(model: string): Promise<Row[]> {
  const file = fileFor(model);
  let mtimeMs = 0;
  let size = -1;
  try {
    const st = await fs.stat(file);
    mtimeMs = st.mtimeMs;
    size = st.size;
  } catch {
    cache.delete(model);
    return [];
  }
  const hit = cache.get(model);
  if (hit && hit.mtimeMs === mtimeMs && hit.size === size) return cloneRows(hit.rows);

  let parsed: Row[];
  try {
    parsed = JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const rows = parsed.map((r) => revive(model, r));
  cache.set(model, { mtimeMs, size, rows });
  return cloneRows(rows);
}

/** Drop the in-process cache. Called after every write. */
function invalidate(model: string): void {
  cache.delete(model);
}

function ephemeralHint(): string | null {
  if (process.env.VERCEL) return "VERCEL";
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return "AWS_LAMBDA";
  if (process.env.NETLIFY) return "NETLIFY";
  if (process.env.FLY_APP_NAME) return "FLY";
  return null;
}

let warnedEphemeral = false;

/* ------------------------------------------------------------------ *
 * Write path: one writer at a time, atomic replace on disk.
 *
 * All mutations go through `mutate` so that read-modify-write can never
 * interleave. `rename` is atomic within a filesystem, so a reader either
 * sees the whole old file or the whole new one — never a truncated file.
 * ------------------------------------------------------------------ */

let writeChain: Promise<unknown> = Promise.resolve();

export function mutate<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  // Keep the chain alive even if this mutation rejects.
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function writeAll(model: string, rows: Row[]): Promise<void> {
  await ensureDir();
  const file = fileFor(model);
  // Unique tmp per write: pid alone collides when one process pipelines
  // several writes to the same model (each writeAll would reuse one tmp).
  const uniq = `${process.pid}.${Date.now().toString(36)}.${Math.floor(Math.random() * 1e9).toString(36)}`;
  const tmp = `${file}.${uniq}.tmp`;
  const serialised = rows.map((r) => serialise(model, r));
  try {
    const payload = `${JSON.stringify(serialised, null, 2)}\n`;
    const handle = await fs.open(tmp, "w");
    try {
      await handle.writeFile(payload, "utf8");
      await handle.sync(); // flush file bytes before rename
    } finally {
      await handle.close();
    }
    await fs.rename(tmp, file);
    // fsync the directory so the rename itself survives a crash/power loss.
    try {
      const dirHandle = await fs.open(path.dirname(file), "r");
      try {
        await dirHandle.sync();
      } finally {
        await dirHandle.close();
      }
    } catch {
      // fsync on dirs fails on some platforms (macOS) — not fatal.
    }
  } catch (e) {
    try {
      await fs.unlink(tmp);
    } catch {}
    const hint = ephemeralHint();
    const where = `model=${model} file=${file} cwd=${process.cwd()} DATA_DIR=${DATA_DIR}`;
    if (!warnedEphemeral && hint) {
      warnedEphemeral = true;
      console.error(
        `[store] write failed on ephemeral host (${hint}). ` +
          `JSON files do not persist on serverless — use a VPS with a persistent disk. ${where}`,
      );
    }
    throw new Error(`Failed to save ${model} (${where}): ${e instanceof Error ? e.message : String(e)}`);
  }
  // Refresh the cache from the file we just wrote (not from the caller's
  // array) so the next read compares against the true post-write mtime+size
  // and can never serve the pre-write copy after a fast save → refresh.
  try {
    const st = await fs.stat(file);
    cache.set(model, { mtimeMs: st.mtimeMs, size: st.size, rows: cloneRows(rows) });
  } catch {
    invalidate(model);
  }
}

/** Diagnostics for /api/health: where writes actually go + is it writable? */
export async function storeInfo(): Promise<{
  dataDir: string;
  cwd: string;
  writable: boolean;
  ephemeralHost: string | null;
  error?: string;
}> {
  const ephemeralHost = ephemeralHint();
  try {
    await ensureDir();
    const probe = path.join(DATA_DIR, `.write-test.${process.pid}`);
    await fs.writeFile(probe, "ok", "utf8");
    await fs.unlink(probe);
    return { dataDir: DATA_DIR, cwd: process.cwd(), writable: true, ephemeralHost };
  } catch (e) {
    return {
      dataDir: DATA_DIR,
      cwd: process.cwd(),
      writable: false,
      ephemeralHost,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/* ------------------------------------------------------------------ *
 * Coercion: dates to ISO strings on disk, back to Date objects on read.
 * ------------------------------------------------------------------ */

function serialise(model: string, row: Row): Row {
  const out: Row = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = value instanceof Date ? value.toISOString() : value;
  }
  return out;
}

function revive(model: string, row: Row): Row {
  const fields = modelDef(model).fields;
  const out: Row = {};
  for (const [key, value] of Object.entries(row)) {
    if (value !== null && fields[key]?.type === "datetime" && typeof value === "string") {
      const d = new Date(value);
      out[key] = Number.isNaN(d.getTime()) ? value : d;
    } else {
      out[key] = value;
    }
  }
  return out;
}

/** Apply schema defaults + auto ids, mirroring what the database would do. */
export function withDefaults(model: string, data: Row): Row {
  const d = modelDef(model);
  const row: Row = {};
  for (const [key, f] of Object.entries(d.fields)) {
    if (data[key] !== undefined) {
      row[key] = data[key];
    } else if (f.autoId) {
      row[key] = newId();
    } else if (f.default !== undefined) {
      row[key] = typeof f.default === "object" ? structuredClone(f.default) : f.default;
    } else {
      row[key] = null;
    }
  }
  // Preserve any extra keys the caller set (forward compatible).
  for (const [key, value] of Object.entries(data)) {
    if (!(key in row)) row[key] = value;
  }

  // Prisma stamps both timestamps on insert (`@default(now())` / `@updatedAt`).
  const now = new Date();
  for (const [key, f] of Object.entries(d.fields)) {
    if ((key === "createdAt" || f.updatedAt) && row[key] == null) row[key] = now;
  }
  return row;
}

/** Set @updatedAt style fields to now. */
export function touch(model: string, row: Row): void {
  const d = modelDef(model);
  for (const [key, f] of Object.entries(d.fields)) {
    if (f.updatedAt) row[key] = new Date();
  }
}

export { DATA_DIR };
