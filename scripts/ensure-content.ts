// Called automatically at the start of `npm run build`.
//
// Content JSON is tracked in git (publish-by-push): a normal checkout already
// has data/, so this is a no-op. It only writes starter content for a truly
// fresh clone, so the build has something to prerender and deploying needs no
// manual seed step. The admin login comes from ADMIN_EMAIL/ADMIN_PASSWORD env
// (data/adminUser.json is gitignored and never committed).
//
// No-op when content already exists -- it never overwrites existing rows.
import fs from "fs";
import path from "path";
import { seedContent } from "./seed-content";

const adminFile = path.join(process.cwd(), "data", "adminUser.json");

function hasContent() {
  try {
    return JSON.parse(fs.readFileSync(adminFile, "utf8")).length > 0;
  } catch {
    return false;
  }
}

async function main() {
  if (hasContent()) {
    console.log("Content present - skipping seed.");
    return;
  }
  console.log("No content found in data/ - writing starter content...");
  await seedContent();
}

main().catch((e) => {
  console.error("Failed to prepare content:", e);
  process.exit(1);
});
