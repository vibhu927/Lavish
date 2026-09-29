import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { deleteCategory, toggleTopRatedCategory } from "@/lib/actions";
import Link from "next/link";

export default async function AdminCategories() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const cats = await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, include: { children: true } });

  return (
    <AdminShell title="Categories">
      <div className="flex justify-between mb-6">
        <p className="text-sm text-zinc-500">{cats.length} categories</p>
        <Link href="/admin/categories/new" className="bg-[var(--brand-charcoal)] text-white rounded-full px-5 py-2 text-sm">+ New Category</Link>
      </div>
      <div className="bg-white rounded-2xl border border-[var(--brand-muted)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--brand-cream)] text-left">
              <tr><th className="p-3">Name</th><th className="p-3">Slug</th><th className="p-3">Parent</th><th className="p-3">Top Rated</th><th className="p-3">Active</th><th className="p-3">Actions</th></tr>
            </thead>
            <tbody>
              {cats.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3 font-medium flex items-center gap-2">{c.image && <img src={c.image} alt="" className="h-8 w-8 rounded object-cover" />}{c.name}</td>
                  <td className="p-3 text-zinc-500">{c.slug}</td>
                  <td className="p-3 text-zinc-500">{c.parentId ? cats.find(x=>x.id===c.parentId)?.name : "—"}</td>
                  <td className="p-3">
                    <form action={async () => { "use server"; await toggleTopRatedCategory(c.id); }}>
                      <button className={`px-2 py-1 rounded-full text-xs ${c.isTopRated ? "bg-[var(--brand-sage)] text-white" : "bg-zinc-100"}`}>{c.isTopRated ? "★ Top" : "—"}</button>
                    </form>
                  </td>
                  <td className="p-3">{c.isActive ? "Yes" : "No"}</td>
                  <td className="p-3 flex gap-2">
                    <Link href={`/admin/categories/${c.id}/edit`} className="text-[var(--brand-leaf)] hover:underline">Edit</Link>
                    <form action={async () => { "use server"; await deleteCategory(c.id); }}>
                      <button className="text-red-600 hover:underline">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
