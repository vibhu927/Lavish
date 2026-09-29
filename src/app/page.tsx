import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { PublicShell } from "@/components/public/PublicShell";
import { ProductCard } from "@/components/public/ProductCard";
import { CategoryCard } from "@/components/public/CategoryCard";
import Link from "next/link";
import { TopRatedBadge } from "@/components/ui/badge";

export const revalidate = 60;

export default async function Home() {
  const [settings, banners, categories, topCategories, topProducts, recentBlogs] = await Promise.all([
    getSettings(),
    prisma.banner.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.category.findMany({ where: { isActive: true, parentId: null }, orderBy: { sortOrder: "asc" }, include: { children: true } }),
    prisma.category.findMany({ where: { isActive: true, isTopRated: true }, orderBy: { sortOrder: "asc" }, take: 6 }),
    prisma.product.findMany({ where: { isActive: true, isTopRated: true }, orderBy: { sortOrder: "asc" }, take: 8, include: { category: true, images: true, tags: { include: { tag: true } } } }),
    prisma.blogPost.findMany({ where: { isPublished: true }, orderBy: { publishedAt: "desc" }, take: 3 }),
  ]);

  return (
    <PublicShell>
      {/* Hero Carousel - simple single banner for now, carousel via CSS */}
      {banners.length > 0 ? (
        <section className="relative bg-[var(--brand-charcoal)] text-white overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-[var(--brand-sage)] text-sm tracking-widest uppercase mb-3">{settings.headerQuote}</p>
              <h1 className="font-display text-4xl md:text-5xl leading-tight">{banners[0].title}</h1>
              {banners[0].subtitle && <p className="text-white/70 mt-4 text-lg">{banners[0].subtitle}</p>}
              {banners[0].ctaText && (
                <Link href={banners[0].ctaLink || "/products"} className="inline-block mt-6 bg-[var(--brand-sage)] text-white rounded-full px-8 py-3 font-medium hover:bg-[var(--brand-leaf)] transition">
                  {banners[0].ctaText}
                </Link>
              )}
            </div>
            <div className="relative">
              <img src={banners[0].desktopUrl} alt={banners[0].title} className="rounded-2xl w-full h-[300px] md:h-[400px] object-cover border border-white/10" />
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-[var(--brand-charcoal)] text-white py-24 text-center">
          <h1 className="font-display text-5xl">{settings.headerQuote || "Pure Beauty, Naturally"}</h1>
          <p className="text-white/60 mt-4">Organic beauty, handcrafted with love.</p>
          <Link href="/products" className="inline-block mt-6 bg-[var(--brand-sage)] text-white rounded-full px-8 py-3">Explore Collection</Link>
        </section>
      )}

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="font-display text-3xl text-[var(--brand-charcoal)]">Shop by Category</h2>
            <p className="text-zinc-500 mt-1">Natural care for every need</p>
          </div>
          <Link href="/categories" className="text-sm text-[var(--brand-leaf)] hover:underline hidden sm:block">View all →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((c) => <CategoryCard key={c.id} category={c} />)}
        </div>
      </section>

      {/* Top Rated Categories */}
      {topCategories.length > 0 && (
        <section className="bg-white border-y border-[var(--brand-muted)] py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl mb-6 flex items-center gap-3">Top Rated Categories <TopRatedBadge /></h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {topCategories.map((c) => <CategoryCard key={c.id} category={c} />)}
            </div>
          </div>
        </section>
      )}

      {/* Top Rated Products */}
      {topProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="font-display text-3xl mb-6">Top Rated Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {topProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          <div className="text-center mt-8">
            <Link href="/products" className="inline-block border border-[var(--brand-charcoal)] text-[var(--brand-charcoal)] rounded-full px-8 py-3 hover:bg-[var(--brand-charcoal)] hover:text-white transition">View All Products</Link>
          </div>
        </section>
      )}

      {/* Blog Preview */}
      {settings.blogEnabled && recentBlogs.length > 0 && (
        <section className="bg-[var(--brand-sage-light)] py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-6">
              <h2 className="font-display text-3xl">From the Blog</h2>
              <Link href="/blogs" className="text-sm text-[var(--brand-leaf)] hover:underline">View all →</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {recentBlogs.map((b) => (
                <Link key={b.id} href={`/blogs/${b.slug}`} className="bg-white rounded-2xl overflow-hidden border border-[var(--brand-muted)] hover:shadow-md transition">
                  {b.coverImage && <img src={b.coverImage} alt={b.title} className="h-40 w-full object-cover" />}
                  <div className="p-4">
                    <h3 className="font-medium line-clamp-2">{b.title}</h3>
                    <p className="text-sm text-zinc-500 line-clamp-2 mt-1">{b.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-[var(--brand-charcoal)] rounded-3xl p-8 md:p-12 text-white text-center">
          <h2 className="font-display text-3xl">{settings.footerHeadline || "Need help choosing?"}</h2>
          <p className="text-white/70 mt-2 max-w-xl mx-auto">{settings.footerDesc?.slice(0,120)}</p>
          <div className="flex justify-center gap-3 mt-6">
            <Link href="/contact" className="bg-[var(--brand-sage)] text-white rounded-full px-8 py-3 font-medium hover:bg-[var(--brand-leaf)] transition">Contact Us</Link>
            {settings.whatsappEnabled && settings.whatsappNumber && (
              <a href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g,"")}?text=${encodeURIComponent(settings.whatsappDefaultMsg||"Hi")}`} target="_blank" className="bg-white text-[var(--brand-charcoal)] rounded-full px-8 py-3 font-medium hover:bg-[var(--brand-sage-light)] transition">WhatsApp</a>
            )}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
