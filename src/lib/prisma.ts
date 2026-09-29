// Backwards-compatible export. The app's 100+ call sites all use
// `prisma.<model>.<op>()`; the JSON client implements that surface.
import { db } from "./db/client";

export const prisma = db;
