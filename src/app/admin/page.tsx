import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminDashboard() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  const [cats, products, topProducts, enquiries, blogs, banners] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.product.count({ where: { isTopRated: true } }),
    prisma.contactSubmission.count(),
    prisma.blogPost.count(),
    prisma.banner.count(),
  ]);
  const recentEnquiries = await prisma.contactSubmission.findMany({ orderBy: { createdAt: "desc" }, take: 5 });
  const recentProducts = await prisma.product.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { category: true } });

  const stats = [
    { label: "Categories", value: cats },
    { label: "Products", value: products },
    { label: "Top Rated", value: topProducts },
    { label: "Enquiries", value: enquiries },
    { label: "Blogs", value: blogs },
    { label: "Banners", value: banners },
  ];

  return (
    <div className="min-h-screen bg-[var(--brand-cream)] flex">
      <aside className="w-64 bg-[#F6F4EF] border-r border-[var(--brand-muted)] p-6 hidden md:block">
        <div className="flex items-center gap-2 mb-8">
          <img src="/logo.jpg" alt="Leaf" className="h-8 w-8 rounded-full" />
          <span className="font-display text-lg">Leaf Admin</span>
        </div>
        <AdminNav />
      </aside>
      <main className="flex-1 p-6 md:p-8">
        <h1 className="font-display text-3xl mb-2">Dashboard</h1>
        <p className="text-zinc-500 mb-6">Welcome, {user.name} — {user.email}</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-[var(--brand-muted)]">
              <p className="text-sm text-zinc-500">{s.label}</p>
              <p className="text-2xl font-semibold mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[var(--brand-muted)] p-5">
            <h2 className="font-medium mb-4">Recent Enquiries</h2>
            {recentEnquiries.length === 0 ? <p className="text-sm text-zinc-500">No enquiries yet.</p> : (
              <div className="space-y-3">
                {recentEnquiries.map((e) => (
                  <div key={e.id} className="flex justify-between text-sm border-b pb-2">
                    <span>{e.name} — {e.email}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${e.status==="NEW"?"bg-amber-100 text-amber-700": e.status==="CONTACTED"?"bg-blue-100 text-blue-700":"bg-green-100 text-green-700"}`}>{e.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-[var(--brand-muted)] p-5">
            <h2 className="font-medium mb-4">Recently Added Products</h2>
            <div className="space-y-3">
              {recentProducts.map((p) => (
                <div key={p.id} className="text-sm flex justify-between">
                  <span>{p.name}</span>
                  <span className="text-zinc-500">{p.category?.name ?? "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:hidden mt-8">
          <AdminNav />
        </div>
      </main>
    </div>
  );
}
