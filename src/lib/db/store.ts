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

type CacheEntry = { mtimeMs: number; rows: Row[] };
const cache = new Map<string, CacheEntry>();

export async function readAll(model: string): Promise<Row[]> {
  const file = fileFor(model);
  let mtimeMs = 0;
  try {
    mtimeMs = (await fs.stat(file)).mtimeMs;
  } catch {
    cache.delete(model);
    return [];
  }
  const hit = cache.get(model);
  if (hit && hit.mtimeMs === mtimeMs) return hit.rows;

  let parsed: Row[];
  try {
    parsed = JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const rows = parsed.map((r) => revive(model, r));
  cache.set(model, { mtimeMs, rows });
  return rows;
}

/** Drop the in-process cache. Called after every write. */
function invalidate(model: string): void {
  cache.delete(model);
}

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
  const tmp = `${file}.${process.pid}.tmp`;
  const serialised = rows.map((r) => serialise(model, r));
  await fs.writeFile(tmp, `${JSON.stringify(serialised, null, 2)}\n`, "utf8");
  await fs.rename(tmp, file);
  invalidate(model);
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
