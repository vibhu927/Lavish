import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { createBanner, deleteBanner } from "@/lib/actions";
import { ActionForm } from "@/components/admin/ActionForm";
import { BannerForm } from "@/components/admin/BannerForm";

export default async function AdminBanners() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const banners = await prisma.banner.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <AdminShell title="Banners / Carousel">
      <div className="grid md:grid-cols-2 gap-6">
        <BannerForm action={createBanner} />

        <div className="space-y-3">
          {banners.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-[var(--brand-muted)] p-4 flex gap-4">
              <img src={b.desktopUrl} alt={b.title} className="h-20 w-32 object-cover rounded-xl border" />
              <div className="flex-1">
                <h4 className="font-medium">{b.title}</h4>
                <p className="text-sm text-zinc-500">{b.subtitle}</p>
                <p className="text-xs text-zinc-400 mt-1">{b.isActive ? "Active" : "Disabled"} • Order {b.sortOrder}</p>
              </div>
              <ActionForm action={deleteBanner.bind(null, b.id)} confirmMessage={`Delete banner "${b.title}"?`}>
                <button className="text-red-600 text-sm">Delete</button>
              </ActionForm>
            </div>
          ))}
          {banners.length === 0 && <p className="text-sm text-zinc-500">No banners yet.</p>}
        </div>
      </div>
    </AdminShell>
  );
}
