import { MODELS, modelDef, type ModelDef, type ModelDefs, type ModelName } from "./models";
import type { Entities } from "./entities";
import {
  mutate,
  readAll,
  touch,
  withDefaults,
  writeAll,
  type Row,
} from "./store";

/* ------------------------------------------------------------------ *
 * Errors mirror the Prisma error codes the old call sites relied on
 * (`.create(...).catch(() => {})` for duplicate tag joins).
 * ------------------------------------------------------------------ */

export class DbError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "DbError";
    this.code = code;
  }
}

const UNIQUE_VIOLATION = "P2002";
const NOT_FOUND = "P2025";

/* ------------------------------------------------------------------ *
 * where
 * ------------------------------------------------------------------ */

type Filter = Record<string, unknown>;

function matches(row: Row, where?: Filter): boolean {
  if (!where) return true;
  for (const [key, cond] of Object.entries(where)) {
    if (key === "AND") {
      const list = (cond as Filter[]) ?? [];
      if (!list.every((c) => matches(row, c))) return false;
      continue;
    }
    if (key === "OR") {
      const list = (cond as Filter[]) ?? [];
      if (list.length && !list.some((c) => matches(row, c))) return false;
      continue;
    }
    if (key === "NOT") {
      if (matches(row, cond as Filter)) return false;
      continue;
    }
    if (!matchField(row[key], cond)) return false;
  }
  return true;
}

function matchField(value: unknown, cond: unknown): boolean {
  // Plain scalar comparison, including null.
  if (cond === null || typeof cond !== "object" || cond instanceof Date) {
    return value === cond || (value == null && cond == null);
  }
  const ops = cond as Record<string, unknown>;
  for (const [op, operand] of Object.entries(ops)) {
    switch (op) {
      case "equals":
        if (!matchField(value, operand)) return false;
        break;
      case "not":
        if (matchField(value, operand)) return false;
        break;
      case "in":
        if (!Array.isArray(operand) || !operand.includes(value as never)) return false;
        break;
      case "notIn":
        if (Array.isArray(operand) && operand.includes(value as never)) return false;
        break;
      case "contains":
        if (!String(value ?? "").toLowerCase().includes(String(operand).toLowerCase()))
          return false;
        break;
      case "startsWith":
        if (!String(value ?? "").toLowerCase().startsWith(String(operand).toLowerCase()))
          return false;
        break;
      case "endsWith":
        if (!String(value ?? "").toLowerCase().endsWith(String(operand).toLowerCase()))
          return false;
        break;
      case "gt":
        if (!((value as never) > (operand as never))) return false;
        break;
      case "gte":
        if (!((value as never) >= (operand as never))) return false;
        break;
      case "lt":
        if (!((value as never) < (operand as never))) return false;
        break;
      case "lte":
        if (!((value as never) <= (operand as never))) return false;
        break;
      case "mode":
        break; // only ever "insensitive", which the contains impl already does
      default:
        throw new Error(`Unsupported where operator: ${op}`);
    }
  }
  return true;
}

/* ------------------------------------------------------------------ *
 * orderBy / select / include
 * ------------------------------------------------------------------ */

function applyOrder(rows: Row[], orderBy?: OrderBy): Row[] {
  if (!orderBy) return rows;
  const clauses = Array.isArray(orderBy) ? orderBy : [orderBy];
  // Stable multi-pass sort: least significant key first.
  const sorted = [...rows];
  for (const clause of clauses) {
    for (const [field, dir] of Object.entries(clause)) {
      const sign = dir === "desc" ? -1 : 1;
      sorted.sort((a, b) => {
        const av = a[field];
        const bv = b[field];
        if (av == null && bv == null) return 0;
        if (av == null) return 1; // nulls last, like SQL default ordering
        if (bv == null) return -1;
        if (av instanceof Date && bv instanceof Date) return (av.getTime() - bv.getTime()) * sign;
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * sign;
        return String(av).localeCompare(String(bv)) * sign;
      });
    }
  }
  return sorted;
}

function samePk(a: Row, b: Row): boolean {
  return Object.entries(a).every(([k, v]) => a[k] === v && b[k] === v);
}

function applySelect(model: string, row: Row, select?: Record<string, boolean>): Row {
  if (!select) return row;
  const out: Row = {};
  for (const [key, wanted] of Object.entries(select)) {
    if (!wanted) continue;
    if (modelDef(model).relations?.[key]) continue; // relations come from `include`
    out[key] = row[key];
  }
  return out;
}

const MAX_INCLUDE_DEPTH = 6;

async function applyInclude(
  model: string,
  row: Row,
  include: Record<string, unknown> | undefined,
  depth = 0,
): Promise<Row> {
  if (!include || depth >= MAX_INCLUDE_DEPTH) return row;
  const def: ModelDef = modelDef(model);
  const out: Row = { ...row };

  for (const [relName, rawOpts] of Object.entries(include)) {
    const rel = def.relations?.[relName];
    if (!rel) throw new Error(`Unknown relation ${model}.${relName}`);
    const opts = (rawOpts === true || rawOpts == null ? {} : rawOpts) as QueryArgs;
    const relatedModel = modelDef(rel.model);

    if (rel.kind === "one") {
      const localValue = row[rel.localField];
      if (localValue == null) {
        out[relName] = null;
        continue;
      }
      if (typeof relatedModel.pk !== "string") {
        throw new Error(`Relation ${model}.${relName} points at a composite-key model`);
      }
      const target = await readAll(rel.model);
      const found = target.find((r) => r[relatedModel.pk as string] === localValue);
      out[relName] = found ? await shape(rel.model, found, opts, depth + 1) : null;
    } else {
      // A "many" relation is matched on the child's foreign key, not its own pk.
      if (typeof def.pk !== "string") {
        throw new Error(`Relation ${model}.${relName} hangs off a composite-key model`);
      }
      const where: Filter = { ...(opts.where ?? {}), [rel.foreignField]: row[def.pk] };
      out[relName] = await query(rel.model, { ...opts, where });
    }
  }
  return out;
}

type QueryArgs = {
  where?: Filter;
  orderBy?: OrderBy;
  take?: number;
  skip?: number;
  select?: Record<string, boolean>;
  include?: Record<string, unknown>;
  distinct?: string | string[];
};

async function shape(
  model: string,
  row: Row,
  args: QueryArgs,
  depth = 0,
): Promise<Row> {
  const withRels = await applyInclude(model, row, args.include, depth);
  return applySelect(model, withRels, args.select);
}

async function query(model: string, args: QueryArgs = {}): Promise<Row[]> {
  let rows = (await readAll(model)).filter((r) => matches(r, args.where));
  rows = applyOrder(rows, args.orderBy);
  if (args.skip) rows = rows.slice(args.skip);
  if (args.take != null) rows = rows.slice(0, Math.max(0, args.take));
  if (args.distinct) {
    const fields = Array.isArray(args.distinct) ? args.distinct : [args.distinct];
    const seen = new Set<string>();
    rows = rows.filter((r) => {
      const k = fields.map((f) => String(r[f])).join("\u0000");
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
  const out: Row[] = [];
  for (const r of rows) out.push(await shape(model, r, args));
  return out;
}

/* ------------------------------------------------------------------ *
 * Constraints
 * ------------------------------------------------------------------ */

function comboMap(combo: string[], row: Row): Row {
  const out: Row = {};
  for (const k of combo) out[k] = row[k];
  return out;
}

/** Primary key plus every field marked `unique` in the model definition. */
function uniqueCombos(model: string): string[][] {
  const def = modelDef(model);
  const combos: string[][] = typeof def.pk === "string" ? [[def.pk]] : [def.pk.slice()];
  for (const [field, f] of Object.entries(def.fields)) {
    if (f.unique) combos.push([field]);
  }
  return combos;
}

async function assertUnique(model: string, candidate: Row, ignore?: Row): Promise<void> {
  const others = await readAll(model);
  for (const combo of uniqueCombos(model)) {
    // SQL semantics: a NULL in any part of the key never collides.
    if (combo.every((k) => candidate[k] == null)) continue;
    for (const other of others) {
      if (ignore && samePk(comboMap(combo, other), comboMap(combo, ignore))) continue;
      if (combo.every((k) => other[k] === candidate[k])) {
        throw new DbError(
          UNIQUE_VIOLATION,
          `Unique constraint failed on ${model}(${combo.join(", ")})`,
        );
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Delegated model operations
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * Result typing
 *
 * `include` and `select` are honoured in the return type, so call sites
 * keep the type safety they had when Prisma generated the client.
 * ------------------------------------------------------------------ */

type RelationsOf<M extends ModelName> =
  ModelDefs[M] extends { relations: infer R } ? R : Record<never, never>;

type RelationValue<M extends ModelName, R extends keyof RelationsOf<M>, Opts> =
  RelationsOf<M>[R] extends { kind: "one"; model: infer T extends ModelName; optional?: infer O }
    ? (O extends true ? Entities[T] | null : Entities[T]) & Expand<T, Opts>
    : RelationsOf<M>[R] extends { kind: "many"; model: infer T extends ModelName }
      ? Array<Entities[T] & Expand<T, Opts>>
      : never;

type Expand<M extends ModelName, A> = A extends { include: infer I }
  ? { [K in keyof I & keyof RelationsOf<M>]: RelationValue<M, K, I[K]> }
  : unknown;

type PickSelected<M extends ModelName, A> = A extends { select: infer S }
  ? { [K in keyof S & keyof Entities[M]]: S[K] extends true ? Entities[M][K] : never }
  : unknown;

type Result<M extends ModelName, A> = Entities[M] & Expand<M, A> & PickSelected<M, A>;

/* eslint-disable @typescript-eslint/no-explicit-any */
type Where = Record<string, unknown>;
type OrderBy = Record<string, "asc" | "desc"> | Array<Record<string, "asc" | "desc">>;

type Args = {
  where?: Where;
  orderBy?: OrderBy;
  take?: number;
  skip?: number;
  select?: Record<string, boolean>;
  include?: Record<string, any>;
  distinct?: string | string[];
};

type WriteArgs<A extends Args> = A & { data: Record<string, unknown> };
type UpsertArgs<A extends Args> = A & {
  where: Where;
  create: Record<string, unknown>;
  update: Record<string, unknown>;
};

/** Untyped implementation surface; the public `Delegate` below adds result types. */
type AnyDelegate = {
  findUnique(args?: Args): Promise<Row | null>;
  findFirst(args?: Args): Promise<Row | null>;
  findMany(args?: Args): Promise<Row[]>;
  create(args: WriteArgs<Args>): Promise<Row>;
  update(args: WriteArgs<Args> & { where: Where }): Promise<Row>;
  upsert(args: UpsertArgs<Args>): Promise<Row>;
  delete(args: { where: Where }): Promise<Row>;
  deleteMany(args?: { where?: Where }): Promise<{ count: number }>;
  count(args?: { where?: Where }): Promise<number>;
};

/** Public surface: results follow the caller's `include` / `select`. */
type Delegate<M extends ModelName> = {
  findUnique<A extends Args = Args>(args?: A): Promise<Result<M, A> | null>;
  findFirst<A extends Args = Args>(args?: A): Promise<Result<M, A> | null>;
  findMany<A extends Args = Args>(args?: A): Promise<Result<M, A>[]>;
  create<A extends Args = Args>(args: WriteArgs<A>): Promise<Result<M, A>>;
  update<A extends Args = Args>(args: WriteArgs<A> & { where: Where }): Promise<Result<M, A>>;
  upsert<A extends Args = Args>(args: UpsertArgs<A>): Promise<Result<M, A>>;
  delete(args: { where: Where }): Promise<Entities[M]>;
  deleteMany(args?: { where?: Where }): Promise<{ count: number }>;
  count(args?: { where?: Where }): Promise<number>;
};

export type JsonClient = { [K in ModelName]: Delegate<K> };

/* eslint-enable @typescript-eslint/no-explicit-any */

function buildDelegate(model: ModelName): AnyDelegate {
  const notFound = (where: Filter) =>
    new DbError(NOT_FOUND, `No ${model} found for ${JSON.stringify(where)}`);

  return {
    async findUnique(args: Args = {}) {
      const rows = await query(model, { ...args, take: 1 });
      return rows[0] ?? null;
    },

    async findFirst(args: Args = {}) {
      const rows = await query(model, { ...args, take: 1 });
      return rows[0] ?? null;
    },

    async findMany(args: Args = {}) {
      return query(model, args);
    },

    async create(args: WriteArgs<Args>) {
      return mutate(async () => {
        const row = withDefaults(model, args.data);
        await assertUnique(model, row);
        const rows = await readAll(model);
        rows.push(row);
        await writeAll(model, rows);
        return shape(model, row, args);
      });
    },

    async update(args: WriteArgs<Args> & { where: Where }) {
      return mutate(async () => {
        const rows = await readAll(model);
        const idx = rows.findIndex((r) => matches(r, args.where));
        if (idx === -1) throw notFound(args.where);
        const merged: Row = { ...rows[idx], ...args.data };
        await assertUnique(model, merged, rows[idx]);
        touch(model, merged);
        rows[idx] = merged;
        await writeAll(model, rows);
        return shape(model, merged, args);
      });
    },

    async upsert(args: UpsertArgs<Args>) {
      return mutate(async () => {
        const rows = await readAll(model);
        const idx = rows.findIndex((r) => matches(r, args.where));
        if (idx === -1) {
          const row = withDefaults(model, args.create);
          await assertUnique(model, row);
          rows.push(row);
          await writeAll(model, rows);
          return shape(model, row, args);
        }
        const merged: Row = { ...rows[idx], ...args.update };
        await assertUnique(model, merged, rows[idx]);
        touch(model, merged);
        rows[idx] = merged;
        await writeAll(model, rows);
        return shape(model, merged, args);
      });
    },

    async delete(args: { where: Where }) {
      return mutate(async () => {
        const rows = await readAll(model);
        const idx = rows.findIndex((r) => matches(r, args.where));
        if (idx === -1) throw notFound(args.where);
        const [removed] = rows.splice(idx, 1);
        await writeAll(model, rows);
        return removed;
      });
    },

    async deleteMany(args: { where?: Where } = {}) {
      return mutate(async () => {
        const rows = await readAll(model);
        const kept = rows.filter((r) => !matches(r, args.where));
        const count = rows.length - kept.length;
        if (count) await writeAll(model, kept);
        return { count };
      });
    },

    async count(args: { where?: Where } = {}) {
      const rows = await readAll(model);
      return rows.filter((r) => matches(r, args.where)).length;
    },
  };
}

function buildClient(): JsonClient {
  const client = {} as JsonClient;
  for (const model of Object.keys(MODELS) as ModelName[]) {
    (client as Record<string, unknown>)[model] = buildDelegate(model);
  }
  return client;
}

/** Cached so every import shares one set of delegates. */
const globalForDb = globalThis as unknown as { __jsonDb?: JsonClient };

export const db: JsonClient = globalForDb.__jsonDb ?? buildClient();

if (process.env.NODE_ENV !== "production") globalForDb.__jsonDb = db;
