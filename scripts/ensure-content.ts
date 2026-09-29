// Called automatically at the start of `npm run build`.
//
// A fresh clone has an empty data/ directory (the JSON files are gitignored,
// because the running server writes to them on every admin edit and a tracked
// working tree would break `git pull` on deploy). This puts starter content in
// place so the build has something to prerender, which means deploying needs
// no manual seed step.
//
// No-op when content already exists -- it never overwrites a live site.
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
