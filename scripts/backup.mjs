#!/usr/bin/env node
// Tar up the two things that matter: the JSON data and the uploaded media.
//   node scripts/backup.mjs            -> writes backups/leaf-YYYYMMDD-HHMMSS.tar.gz
import { execFileSync } from "child_process";
import { mkdirSync, statSync } from "fs";
import path from "path";

const root = process.cwd();
const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
const outDir = path.join(root, "backups");
mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `leaf-${stamp}.tar.gz`);

// macOS tar records AppleDouble sidecars (._foo) for every file unless
// COPYFILE_DISABLE is set; harmless on Linux, but a Mac-made backup should
// restore cleanly, so strip them here and on restore.
const env = { ...process.env, COPYFILE_DISABLE: "1" };
execFileSync(
  "tar",
  [
    "--exclude=.DS_Store",
    "--exclude=*/.DS_Store",
    "--exclude=._*",
    "--exclude=*/._*",
    "-czf",
    out,
    "data",
    "uploads",
  ],
  { cwd: root, env }
);
const mb = (statSync(out).size / 1024 / 1024).toFixed(2);
console.log(`backup written: ${out} (${mb} MB)`);
