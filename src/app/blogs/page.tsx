import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { PublicShell } from "@/components/public/PublicShell";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function BlogsPage() {
  const settings = await getSettings();
  if (!settings.blogEnabled) notFound();
  const posts = await prisma.blogPost.findMany({ where: { isPublished: true }, orderBy: { publishedAt: "desc" } });

  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-4xl mb-2">Blogs</h1>
        <p className="text-zinc-500 mb-8">Tips, stories and organic beauty wisdom</p>
        <div className="grid md:grid-cols-3 gap-6">
          {posts.map((p) => (
            <Link key={p.id} href={`/blogs/${p.slug}`} className="bg-white rounded-2xl overflow-hidden border border-[var(--brand-muted)] hover:shadow-md transition">
              {p.coverImage && <img src={p.coverImage} alt={p.title} className="h-48 w-full object-cover" />}
              <div className="p-5">
                <h3 className="font-medium line-clamp-2">{p.title}</h3>
                <p className="text-sm text-zinc-500 line-clamp-2 mt-2">{p.excerpt}</p>
                <p className="text-xs text-zinc-400 mt-3">{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : ""}</p>
              </div>
            </Link>
          ))}
        </div>
        {posts.length===0 && <p className="text-sm text-zinc-500 text-center mt-8">No posts yet.</p>}
      </div>
    </PublicShell>
  );
}
