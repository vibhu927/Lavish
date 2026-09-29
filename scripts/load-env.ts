// Next.js loads .env for `next dev` / `next build` / `next start`, but the
// scripts in this folder run under bare tsx/node and get nothing. Without this,
// setting ADMIN_EMAIL / ADMIN_PASSWORD in .env would be silently ignored.
import fs from "fs";
import path from "path";

export function loadEnv(root = process.cwd()) {
  // .env.local wins over .env, matching Next's precedence. Real env vars
  // always win over both, so `ADMIN_PASSWORD=x npm run seed` still works.
  for (const file of [".env", ".env.local"]) {
    const full = path.join(root, file);
    if (!fs.existsSync(full)) continue;
    for (const rawLine of fs.readFileSync(full, "utf8").split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      if (!key || key in process.env) continue;
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}
