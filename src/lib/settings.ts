import { prisma } from "./prisma";

export async function getSettings() {
  // upsert, not find-then-create: several pages render in parallel and would
  // otherwise all try to insert the singleton row, so all but one would fail
  // on the unique constraint.
  return prisma.websiteSettings.upsert({
    where: { id: "settings" },
    update: {},
    create: { id: "settings" },
  });
}
