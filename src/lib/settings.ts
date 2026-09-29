import { prisma } from "./prisma";

export async function getSettings() {
  let s = await prisma.websiteSettings.findUnique({ where: { id: "settings" } });
  if (!s) {
    s = await prisma.websiteSettings.create({
      data: { id: "settings" },
    });
  }
  return s;
}
