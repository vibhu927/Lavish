import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { PublicShell } from "@/components/public/PublicShell";
import { notFound } from "next/navigation";
import Link from "next/link";

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await prisma.blogPost.findMany({ where: { isPublished: true }, select: { slug: true } });
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function BlogDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const settings = await getSettings();
  if (!settings.blogEnabled) notFound();
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post || !post.isPublished) notFound();

  return (
    <PublicShell>
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/blogs" className="text-sm text-[var(--brand-leaf)] hover:underline">← All blogs</Link>
        {post.coverImage && <img src={post.coverImage} alt={post.title} className="w-full h-72 object-cover rounded-3xl mt-6 border border-[var(--brand-muted)]" />}
        <h1 className="font-display text-4xl mt-6">{post.title}</h1>
        <p className="text-sm text-zinc-500 mt-2">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ""}</p>
        {post.excerpt && <p className="text-lg text-zinc-600 mt-4 border-l-4 border-[var(--brand-sage)] pl-4">{post.excerpt}</p>}
        <div className="prose prose-zinc max-w-none mt-6 whitespace-pre-wrap leading-relaxed">{post.content}</div>
      </article>
    </PublicShell>
  );
}
