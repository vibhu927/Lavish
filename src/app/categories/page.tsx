import { prisma } from "@/lib/prisma";
import { PublicShell } from "@/components/public/PublicShell";
import { CategoryCard } from "@/components/public/CategoryCard";

export const revalidate = 60;
export const metadata = { title: "Categories — Leaf Organic" };

export default async function CategoriesPage() {
  const cats = await prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, include: { children: true } });
  const topCats = cats.filter((c) => c.parentId === null);
  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-4xl mb-2">Categories</h1>
        <p className="text-zinc-500 mb-8">Browse our organic collections</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {topCats.map((c) => <CategoryCard key={c.id} category={c} />)}
        </div>
        {cats.length===0 && <p className="text-sm text-zinc-500 mt-8">No categories yet.</p>}
      </div>
    </PublicShell>
  );
}
