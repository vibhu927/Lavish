import { prisma } from "./prisma";
import { withDefaults } from "./db/store";
import type { WebsiteSettings } from "./db/entities";

export async function getSettings(): Promise<WebsiteSettings> {
  const found = await prisma.websiteSettings.findUnique({ where: { id: "settings" } });
  if (found) return found;
  // Deliberately read-only. Every public and admin page renders through here,
  // and the old upsert() wrote to disk on each one -- so on a host with a
  // read-only or ephemeral bundle filesystem (Vercel, any lambda) simply
  // *viewing* a page threw and Next showed "Application error". Returning the
  // schema defaults in memory keeps reads working; the row is persisted by
  // updateSettings() the first time settings are actually saved.
  return withDefaults("websiteSettings", { id: "settings" }) as WebsiteSettings;
}
