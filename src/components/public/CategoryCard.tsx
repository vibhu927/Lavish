import Link from "next/link";
import { TopRatedBadge } from "@/components/ui/badge";

export function CategoryCard({ category }: { category: any }) {
  return (
    <Link href={`/categories/${category.slug}`} className="group bg-white rounded-2xl overflow-hidden border border-[var(--brand-muted)] hover:shadow-md transition">
      <div className="aspect-[4/3] bg-[var(--brand-cream)] relative overflow-hidden flex items-center justify-center">
        {category.image ? (
          <img src={category.image} alt={category.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        ) : (
          <span className="font-display text-4xl text-[var(--brand-sage)]">{category.name[0]}</span>
        )}
        {category.isTopRated && <div className="absolute top-3 left-3"><TopRatedBadge /></div>}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-[var(--brand-charcoal)]">{category.name}</h3>
        {category.description && <p className="text-sm text-zinc-500 line-clamp-2 mt-1">{category.description}</p>}
        {category.children?.length > 0 && (
          <p className="text-xs text-[var(--brand-leaf)] mt-2">{category.children.length} subcategories</p>
        )}
      </div>
    </Link>
  );
}
