import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { deleteProduct } from "@/lib/actions";
import { ActionForm } from "@/components/admin/ActionForm";
import Link from "next/link";

export default async function AdminProducts() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" }, include: { category: true, images: true } });

  return (
    <AdminShell title="Products">
      <div className="flex justify-between mb-6">
        <p className="text-sm text-zinc-500">{products.length} products</p>
        <Link href="/admin/products/new" className="bg-[var(--brand-charcoal)] text-white rounded-full px-5 py-2 text-sm">+ New Product</Link>
      </div>
      <div className="bg-white rounded-2xl border border-[var(--brand-muted)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--brand-cream)] text-left">
              <tr><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Weight</th><th className="p-3">Top</th><th className="p-3">Active</th><th className="p-3">Actions</th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3 flex items-center gap-2">
                    <img src={p.images[0]?.url || "/uploads/general/placeholder.jpg"} alt="" className="h-10 w-10 rounded object-cover border" />
                    <div><div className="font-medium">{p.name}</div><div className="text-xs text-zinc-500">{p.slug}</div></div>
                  </td>
                  <td className="p-3">{p.category?.name ?? "— (category deleted)"}</td>
                  <td className="p-3">{p.weight || "—"}</td>
                  <td className="p-3">{p.isTopRated ? "★" : "—"}</td>
                  <td className="p-3">{p.isActive ? "Yes" : "No"}</td>
                  <td className="p-3 flex gap-2">
                    <Link href={`/admin/products/${p.id}/edit`} className="text-[var(--brand-leaf)] hover:underline">Edit</Link>
                    <Link href={`/products/${p.slug}`} target="_blank" className="text-zinc-500 hover:underline">View</Link>
                    <ActionForm action={deleteProduct.bind(null, p.id)} confirmMessage={`Delete product "${p.name}"?`}>
                      <button className="text-red-600 hover:underline">Delete</button>
                    </ActionForm>
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
