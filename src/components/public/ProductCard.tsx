import Link from "next/link";
import { TopRatedBadge } from "@/components/ui/badge";

export function ProductCard({ product }: { product: any }) {
  const img = product.images?.[0]?.url || "/uploads/general/placeholder.jpg";
  return (
    <Link href={`/products/${product.slug}`} className="group bg-white rounded-2xl overflow-hidden border border-[var(--brand-muted)] hover:shadow-lg transition">
      <div className="relative aspect-[3/4] bg-[var(--brand-cream)] overflow-hidden">
        <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        {product.isTopRated && <div className="absolute top-3 left-3"><TopRatedBadge /></div>}
        {product.weight && <span className="absolute top-3 right-3 bg-white/90 text-[var(--brand-charcoal)] text-xs px-2 py-1 rounded-full">{product.weight}</span>}
      </div>
      <div className="p-4">
        <p className="text-xs text-[var(--brand-leaf)] font-medium">{product.category?.name}</p>
        <h3 className="font-medium text-[var(--brand-charcoal)] leading-tight mt-1 line-clamp-2">{product.name}</h3>
        {product.shortDesc && <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{product.shortDesc}</p>}
        <div className="flex flex-wrap gap-1 mt-2">
          {product.tags?.slice(0,2).map((pt:any)=><span key={pt.tag?.slug||pt.slug} className="text-[10px] bg-[var(--brand-sage-light)] text-[var(--brand-teal)] px-2 py-0.5 rounded-full">{pt.tag?.name||pt.name}</span>)}
        </div>
      </div>
    </Link>
  );
}
