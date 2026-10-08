import { AdminNav } from "./AdminNav";
import { isGitHubSyncEnabled } from "@/lib/github";

/**
 * On Vercel (only), every admin page shows whether live saving works.
 * No more guessing: green = saves publish, red = saves will fail + why.
 */
export function PublishBanner() {
  if (!process.env.VERCEL) return null; // localhost/VPS save to disk — nothing to say
  if (isGitHubSyncEnabled()) {
    return (
      <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-sm text-green-800">
        Live auto-publish <strong>ON</strong> — saves commit to GitHub and appear after the Vercel rebuild finishes (~2 min). Don&apos;t expect them instantly on refresh.
      </div>
    );
  }
  return (
    <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-800">
      Live saving <strong>OFF</strong> — edits and uploads made here will fail. Either set <code>GITHUB_TOKEN</code> + <code>GITHUB_REPO</code> on Vercel (README → “live editing on Vercel”), or edit on localhost and push.
    </div>
  );
}

export function AdminShell({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="min-h-screen bg-[var(--brand-cream)] flex">
      <aside className="w-64 bg-[#F6F4EF] border-r border-[var(--brand-muted)] p-6 hidden md:block sticky top-0 h-screen overflow-auto">
        <div className="flex items-center gap-2 mb-8">
          <img src="/logo.jpg" alt="Leaf" className="h-8 w-8 rounded-full" />
          <span className="font-display text-lg">Leaf Admin</span>
        </div>
        <AdminNav />
      </aside>
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <PublishBanner />
        {title && <h1 className="font-display text-3xl mb-6">{title}</h1>}
        {children}
        <div className="md:hidden mt-8 border-t pt-6">
          <AdminNav />
        </div>
      </main>
    </div>
  );
}
