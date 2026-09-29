import { prisma } from "@/lib/prisma";
import { PublicShell } from "@/components/public/PublicShell";
import { ProductCard } from "@/components/public/ProductCard";
import { CategoryCard } from "@/components/public/CategoryCard";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 60;

export async function generateStaticParams() {
  const cats = await prisma.category.findMany({ select: { slug: true } });
  return cats.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = await prisma.category.findUnique({ where: { slug } });
  if (!cat) return {};
  return { title: `${cat.name} — Leaf Organic`, description: cat.description || undefined };
}

export default async function CategoryDetail({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string>> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await prisma.category.findUnique({ where: { slug }, include: { children: true } });
  if (!category) notFound();

  const q = sp.q || "";
  const sort = sp.sort || "latest";
  const tag = sp.tag || "";
  const page = Math.max(1, Number(sp.page || 1));
  const limit = 12;

  const where: any = { isActive: true, categoryId: category.id };
  if (q) where.name = { contains: q, mode: "insensitive" } as any;
  // SQLite doesn't support mode insensitive, fallback to contains
  // We'll adjust for sqlite: use contains via raw? For now simple.

  // For sqlite, we can't use mode; so we handle via SQL filter manually if needed. Keep simple.

  let orderBy: any = { createdAt: "desc" };
  if (sort === "name") orderBy = { name: "asc" };
  if (sort === "order") orderBy = { sortOrder: "asc" };

  // Fetch all then filter for sqlite compatibility (small dataset)
  let products = await prisma.product.findMany({ where: { isActive: true, categoryId: category.id }, orderBy, include: { category: true, images: true, tags: { include: { tag: true } } } });
  if (q) {
    const lower = q.toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(lower) || (p.shortDesc||"").toLowerCase().includes(lower));
  }
  if (tag) {
    products = products.filter((p) => p.tags.some((pt) => pt.tag.slug === tag));
  }
  const total = products.length;
  const paginated = products.slice((page-1)*limit, page*limit);
  const totalPages = Math.max(1, Math.ceil(total/limit));

  const subcategories = category.children;

  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
          <Link href="/categories" className="hover:underline">Categories</Link>
          <span>/</span>
          <span className="text-[var(--brand-charcoal)]">{category.name}</span>
        </div>

        <div className="bg-white rounded-3xl border border-[var(--brand-muted)] p-6 md:p-8 mb-8 flex flex-col md:flex-row gap-6">
          {category.image && <img src={category.image} alt={category.name} className="h-32 w-32 rounded-2xl object-cover flex-shrink-0" />}
          <div>
            <h1 className="font-display text-3xl">{category.name}</h1>
            {category.description && <p className="text-zinc-600 mt-2 max-w-2xl">{category.description}</p>}
            {category.isTopRated && <span className="inline-flex mt-3 bg-[var(--brand-sage)] text-white text-xs px-3 py-1 rounded-full">★ Top Rated</span>}
          </div>
        </div>

        {subcategories.length > 0 && (
          <div className="mb-8">
            <h2 className="font-medium mb-3">Subcategories</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {subcategories.map((sc) => <CategoryCard key={sc.id} category={sc} />)}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-[var(--brand-muted)] p-4 mb-6 flex flex-wrap gap-3 items-center">
          <form className="flex gap-2 flex-1 min-w-[200px]">
            <input name="q" defaultValue={q} placeholder="Search products..." className="flex-1 h-10 rounded-full border border-[var(--brand-muted)] px-4 text-sm" />
            <button className="bg-[var(--brand-charcoal)] text-white rounded-full px-5 text-sm">Search</button>
          </form>
          <div className="flex gap-2 text-sm">
            <Link href={`/categories/${slug}?sort=latest`} className={`px-3 py-1 rounded-full border ${sort==="latest"?"bg-[var(--brand-charcoal)] text-white":"bg-white"}`}>Latest</Link>
            <Link href={`/categories/${slug}?sort=name`} className={`px-3 py-1 rounded-full border ${sort==="name"?"bg-[var(--brand-charcoal)] text-white":"bg-white"}`}>Name</Link>
            <Link href={`/categories/${slug}`} className="px-3 py-1 rounded-full border bg-white">Clear</Link>
          </div>
        </div>

        {paginated.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[var(--brand-muted)]">
            <p className="text-zinc-500">No products found in this category.</p>
            <Link href="/products" className="text-sm text-[var(--brand-leaf)] hover:underline mt-2 inline-block">Browse all products →</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginated.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <Link key={n} href={`/categories/${slug}?page=${n}&sort=${sort}&q=${q}`} className={`h-9 w-9 flex items-center justify-center rounded-full border text-sm ${n===page?"bg-[var(--brand-charcoal)] text-white":"bg-white"}`}>{n}</Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PublicShell>
  );
}
