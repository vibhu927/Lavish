import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { createBlog, deleteBlog } from "@/lib/actions";
import { BlogForm } from "@/components/admin/BlogForm";
import { getSettings } from "@/lib/settings";

export default async function AdminBlogs() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const settings = await getSettings();
  const blogs = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });

  if (!settings.blogEnabled) {
    return (
      <AdminShell title="Blogs — Disabled">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <p className="text-sm text-amber-800">Blogs are disabled in Settings. Enable to manage posts.</p>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Blogs">
      <div className="grid md:grid-cols-2 gap-6">
        <BlogForm action={createBlog} />

        <div className="space-y-3">
          {blogs.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-[var(--brand-muted)] p-4">
              <h4 className="font-medium">{b.title}</h4>
              <p className="text-xs text-zinc-500">{b.slug} • {b.isPublished ? "Published" : "Draft"}</p>
              <p className="text-sm text-zinc-600 mt-1 line-clamp-2">{b.excerpt}</p>
              <form action={async () => { "use server"; await deleteBlog(b.id); }} className="mt-2">
                <button className="text-red-600 text-sm">Delete</button>
              </form>
            </div>
          ))}
          {blogs.length===0 && <p className="text-sm text-zinc-500">No posts.</p>}
        </div>
      </div>
    </AdminShell>
  );
}
