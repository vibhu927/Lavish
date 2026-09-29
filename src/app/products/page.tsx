import { prisma } from "@/lib/prisma";
import { PublicShell } from "@/components/public/PublicShell";
import { ProductCard } from "@/components/public/ProductCard";
import Link from "next/link";

export const revalidate = 60;

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const q = sp.q || "";
  const category = sp.category || "";
  const sort = sp.sort || "latest";
  const page = Math.max(1, Number(sp.page || 1));
  const limit = 12;

  const categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });

  let orderBy: any = { createdAt: "desc" };
  if (sort === "name") orderBy = { name: "asc" };
  if (sort === "order") orderBy = { sortOrder: "asc" };

  let products = await prisma.product.findMany({
    where: { isActive: true, ...(category ? { category: { slug: category } } : {}) },
    orderBy,
    include: { category: true, images: true, tags: { include: { tag: true } } },
  });
  if (q) {
    const lower = q.toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(lower) || (p.shortDesc||"").toLowerCase().includes(lower));
  }
  const total = products.length;
  const paginated = products.slice((page-1)*limit, page*limit);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display text-4xl mb-2">Products</h1>
        <p className="text-zinc-500 mb-6">Handcrafted organic beauty</p>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-[var(--brand-muted)] p-5 sticky top-24">
              <h3 className="font-medium mb-3">Filters</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Category</p>
                  <div className="space-y-1">
                    <Link href="/products" className={`block text-sm ${!category ? "text-[var(--brand-leaf)] font-medium" : "text-zinc-600 hover:text-[var(--brand-charcoal)]"}`}>All</Link>
                    {categories.map((c) => (
                      <Link key={c.id} href={`/products?category=${c.slug}`} className={`block text-sm ${category===c.slug ? "text-[var(--brand-leaf)] font-medium" : "text-zinc-600 hover:text-[var(--brand-charcoal)]"}`}>{c.name}</Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Sort</p>
                  <div className="flex flex-col gap-1 text-sm">
                    <Link href={`/products?category=${category}&sort=latest&q=${q}`} className={sort==="latest"?"text-[var(--brand-leaf)]":"text-zinc-600"}>Latest</Link>
                    <Link href={`/products?category=${category}&sort=name&q=${q}`} className={sort==="name"?"text-[var(--brand-leaf)]":"text-zinc-600"}>Name A-Z</Link>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <form className="flex gap-2 mb-6">
              <input name="q" defaultValue={q} placeholder="Search products..." className="flex-1 h-11 rounded-full border border-[var(--brand-muted)] bg-white px-5 text-sm" />
              {category && <input type="hidden" name="category" value={category} />}
              <button className="bg-[var(--brand-charcoal)] text-white rounded-full px-6 text-sm">Search</button>
            </form>

            <p className="text-sm text-zinc-500 mb-4">{total} products found</p>

            {paginated.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[var(--brand-muted)] p-12 text-center">
                <p className="text-zinc-500">No products match your filters.</p>
                <Link href="/products" className="text-sm text-[var(--brand-leaf)] hover:underline mt-2 inline-block">Clear filters</Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {paginated.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                      <Link key={n} href={`/products?page=${n}&category=${category}&sort=${sort}&q=${q}`} className={`h-9 w-9 flex items-center justify-center rounded-full border text-sm ${n===page ? "bg-[var(--brand-charcoal)] text-white" : "bg-white"}`}>{n}</Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
