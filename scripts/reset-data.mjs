// Wipes the JSON data layer back to empty collections.
import { promises as fs } from "fs";
import path from "path";

const DIR = path.join(process.cwd(), "data");
const MODELS = [
  "adminUser", "category", "product", "productImage", "productVariant",
  "productAttribute", "tag", "productTag", "banner", "blogPost",
  "contactSubmission", "websiteSettings", "mediaAsset",
];

await fs.mkdir(DIR, { recursive: true });
for (const m of MODELS) {
  await fs.writeFile(path.join(DIR, `${m}.json`), "[]\n", "utf8");
}
console.log(`Reset ${MODELS.length} collections in ${DIR}`);
