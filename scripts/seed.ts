// Writes starter content into data/*.json. This is NOT database setup -- the
// app has no database. It only fills the JSON files with something to look at
// so a fresh install isn't blank.
//
//   npm run seed
//
// It is safe to re-run: existing rows are left alone.
import { seedContent } from "./seed-content";

seedContent()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
