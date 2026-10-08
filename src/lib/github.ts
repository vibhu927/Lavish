import { promises as fs } from "fs";
import path from "path";
import { DATA_DIR, takeDirtyModels } from "./db/store";

/**
 * Auto-publish to GitHub (portfolio-style, zero Vercel services).
 *
 * The live Vercel filesystem is read-only/ephemeral, so CMS edits made on
 * the live site can never persist there. Instead, every mutation is committed
 * straight back to the GitHub repo (single commit via the Git Data API) and
 * Vercel redeploys with the new content — the same result as editing on
 * localhost + `git push`, but automatic.
 *
 * Required env (Vercel → Settings → Environment Variables):
 *   GITHUB_TOKEN  — classic PAT with `repo` scope (or fine-grained token
 *                   with Contents read+write on this repo)
 *   GITHUB_REPO   — "owner/repo" (e.g. "vibhu927/Lavish")
 *   GITHUB_BRANCH — defaults to "main"
 *
 * Without the token nothing changes: localhost/VPS keep working on disk,
 * and live writes fail fast with an honest error (see store.ts).
 */

export type GitHubFile = {
  /** repo-relative posix path, e.g. "data/tag.json" or "uploads/x/y.png" */
  path: string;
  /** file bytes (Buffer) or text */
  content: Buffer | string;
};

function cfg(): { token: string; repo: string; branch: string } | null {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo || !repo.includes("/")) return null;
  return { token, repo, branch: process.env.GITHUB_BRANCH || "main" };
}

export function isGitHubSyncEnabled(): boolean {
  return cfg() !== null;
}

type GhRef = { object?: { sha?: string } };
type GhSha = { sha: string };

async function gh<T>(
  c: { token: string; repo: string },
  method: string,
  apiPath: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`https://api.github.com/repos/${c.repo}${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${c.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "leaf-organic-cms",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? (JSON.parse(text) as unknown) : null;
  } catch {
    // non-JSON error body
  }
  if (!res.ok) {
    const msg =
      (json as { message?: string } | null)?.message || text || `HTTP ${res.status}`;
    throw new Error(`GitHub API ${method} ${apiPath} failed (${res.status}): ${msg}`);
  }
  return json as T;
}

/**
 * Push files as ONE commit (create blobs → tree → commit → update ref).
 * `deletedPaths` removes files from the repo in the same commit.
 */
export async function pushFilesToGitHub(
  files: GitHubFile[],
  deletedPaths: string[] = [],
  message = "cms: content update",
): Promise<void> {
  const c = cfg();
  if (!c) return; // sync not configured — local disk is the source of truth
  if (files.length === 0 && deletedPaths.length === 0) return;

  // Resolve the branch head once; retry once if it moved under us (409/422).
  for (let attempt = 0; attempt < 2; attempt++) {
    const ref = await gh<GhRef>(c, "GET", `/git/ref/heads/${c.branch}`);
    const baseSha: string | undefined = ref.object?.sha;
    if (!baseSha) throw new Error(`GitHub branch "${c.branch}" not found in ${c.repo}.`);

    const tree: Array<Record<string, unknown>> = [];
    for (const f of files) {
      const buf = Buffer.isBuffer(f.content) ? f.content : Buffer.from(f.content, "utf8");
      const blob = await gh<GhSha>(c, "POST", "/git/blobs", {
        content: buf.toString("base64"),
        encoding: "base64",
      });
      tree.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
    }
    for (const p of deletedPaths) {
      tree.push({ path: p, mode: "100644", type: "blob", sha: null });
    }

    const treeRes = await gh<GhSha>(c, "POST", "/git/trees", { base_tree: baseSha, tree });
    const commit = await gh<GhSha>(c, "POST", "/git/commits", {
      message,
      tree: treeRes.sha,
      parents: [baseSha],
    });
    try {
      await gh<unknown>(c, "PATCH", `/git/ref/heads/${c.branch}`, { sha: commit.sha });
      return;
    } catch (e) {
      // Head moved between our read and update (concurrent save) — retry once.
      if (attempt === 0) continue;
      throw e;
    }
  }
}

/**
 * Commit every data/*.json that changed since the last publish, plus any
 * extra files (e.g. a freshly uploaded image). Call at the end of each
 * mutating server action / API route. No-op without the token.
 */
export async function publishDirtyContent(
  message: string,
  extraFiles: GitHubFile[] = [],
  deletedPaths: string[] = [],
): Promise<void> {
  if (!isGitHubSyncEnabled()) return;
  const models = takeDirtyModels();
  const files: GitHubFile[] = [...extraFiles];
  for (const model of models) {
    try {
      const content = await fs.readFile(path.join(DATA_DIR, `${model}.json`), "utf8");
      files.push({ path: `data/${model}.json`, content });
    } catch (e) {
      console.error(`[github] skip ${model}.json (unreadable):`, e instanceof Error ? e.message : e);
    }
  }
  if (files.length === 0 && deletedPaths.length === 0) return;
  await pushFilesToGitHub(files, deletedPaths, message);
}
