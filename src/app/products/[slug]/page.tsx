import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { PublicShell } from "@/components/public/PublicShell";
import { TopRatedBadge } from "@/components/ui/badge";
import { WhatsAppButton } from "@/components/public/WhatsAppButton";
import { ProductCard } from "@/components/public/ProductCard";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 60;

export async function generateStaticParams() {
  const products = await prisma.product.findMany({ select: { slug: true } });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await prisma.product.findUnique({ where: { slug } });
  if (!p) return {};
  return {
    title: p.seoTitle || `${p.name} — Leaf Organic`,
    description: p.seoDesc || p.shortDesc || p.description?.slice(0, 150),
    openGraph: { images: p ? [] : [] },
  };
}

export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
      attributes: true,
      tags: { include: { tag: true } },
    },
  });
  if (!product || !product.isActive) notFound();
  const settings = await getSettings();
  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id }, isActive: true },
    take: 4,
    include: { category: true, images: true, tags: { include: { tag: true } } },
  });
  const primaryImage = product.images.find((i) => i.isPrimary) || product.images[0];

  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
          <Link href="/products" className="hover:underline">Products</Link>
          <span>/</span>
          <Link href={`/categories/${product.category.slug}`} className="hover:underline">{product.category.name}</Link>
          <span>/</span>
          <span className="text-[var(--brand-charcoal)]">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Gallery */}
          <div>
            <div className="aspect-[3/4] bg-[var(--brand-cream)] rounded-3xl overflow-hidden border border-[var(--brand-muted)]">
              {primaryImage ? (
                <img src={primaryImage.url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-400">No image</div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {product.images.map((img) => (
                  <img key={img.id} src={img.url} alt="" className="h-20 w-20 rounded-xl object-cover border border-[var(--brand-muted)] flex-shrink-0" />
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href={`/categories/${product.category.slug}`} className="text-sm text-[var(--brand-leaf)] font-medium">{product.category.name}</Link>
              {product.isTopRated && <TopRatedBadge />}
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-[var(--brand-charcoal)]">{product.name}</h1>
            {product.weight && <p className="text-sm text-zinc-500 mt-1">Weight: {product.weight}</p>}
            {product.shortDesc && <p className="text-lg text-zinc-600 mt-3">{product.shortDesc}</p>}

            {product.description && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-zinc-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {product.benefits && (
              <div className="mt-4">
                <h3 className="font-medium mb-1">Benefits</h3>
                <p className="text-sm text-zinc-600">{product.benefits}</p>
              </div>
            )}

            {product.ingredients && (
              <div className="mt-4 p-4 bg-[var(--brand-sage-light)] rounded-2xl">
                <h3 className="font-medium text-sm mb-1">Ingredients</h3>
                <p className="text-sm text-zinc-700">{product.ingredients}</p>
              </div>
            )}

            {product.howToUse && (
              <div className="mt-4">
                <h3 className="font-medium mb-1">How to Use</h3>
                <p className="text-sm text-zinc-600">{product.howToUse}</p>
              </div>
            )}

            {product.attributes.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Specifications</h3>
                <div className="bg-white rounded-2xl border border-[var(--brand-muted)] overflow-hidden">
                  {product.attributes.map((a) => (
                    <div key={a.id} className="flex justify-between p-3 border-b last:border-0 text-sm">
                      <span className="text-zinc-500">{a.key}</span>
                      <span className="font-medium text-[var(--brand-charcoal)]">{a.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {product.tags.map((pt) => (
                  <span key={pt.tag.id} className="text-xs bg-[var(--brand-sage-light)] text-[var(--brand-teal)] px-3 py-1 rounded-full">{pt.tag.name}</span>
                ))}
              </div>
            )}

            {product.variants.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Available Variants</h3>
                <div className="grid grid-cols-2 gap-2">
                  {product.variants.map((v) => (
                    <div key={v.id} className="bg-white border border-[var(--brand-muted)] rounded-xl p-3 text-sm">
                      <p className="font-medium">{v.name}</p>
                      {v.weight && <p className="text-zinc-500 text-xs">{v.weight}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="mt-8 space-y-3">
              {settings.whatsappEnabled && settings.whatsappNumber ? (
                <WhatsAppButton number={settings.whatsappNumber} template={settings.whatsappProductTemplate || "Hi, I want more info about {productName} — {productUrl}"} product={{ name: product.name, weight: product.weight, slug: product.slug }} />
              ) : null}
              <Link href="/contact" className="inline-flex w-full items-center justify-center rounded-full border border-[var(--brand-charcoal)] text-[var(--brand-charcoal)] h-11 px-6 font-medium hover:bg-[var(--brand-charcoal)] hover:text-white transition">
                Enquire via Contact Form
              </Link>
              <p className="text-xs text-center text-zinc-400">No checkout — enquire for details & availability.</p>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-2xl mb-4">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}

        {/* JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.shortDesc || product.description,
          category: product.category.name,
          brand: { "@type": "Brand", name: "Leaf Organic" },
        })}} />
      </div>
    </PublicShell>
  );
}
