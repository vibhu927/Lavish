import Link from "next/link";
import { getSettings } from "@/lib/settings";

export async function Footer() {
  const s = await getSettings();
  return (
    <footer className="bg-[var(--brand-charcoal)] text-white mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-display text-xl mb-3">{s.footerHeadline}</h3>
            <p className="text-sm text-white/70 leading-6">{s.footerDesc}</p>
          </div>
          <div>
            <h4 className="font-medium mb-3 text-[var(--brand-sage)]">Explore</h4>
            <div className="flex flex-col gap-2 text-sm text-white/80">
              <Link href="/categories" className="hover:text-white">Categories</Link>
              <Link href="/products" className="hover:text-white">Products</Link>
              <Link href="/blogs" className="hover:text-white">Blogs</Link>
              <Link href="/contact" className="hover:text-white">Contact</Link>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-3 text-[var(--brand-sage)]">Contact</h4>
            <div className="text-sm text-white/80 space-y-1">
              <p>{s.address}</p>
              <p>{s.phone}</p>
              <p>{s.email}</p>
              {s.gstNumber && <p className="text-white/60">GST: {s.gstNumber}</p>}
              <p className="text-white/60">{s.businessHours}</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-3 text-[var(--brand-sage)]">Follow</h4>
            <div className="flex gap-3 text-sm">
              {s.instagramUrl && <a href={s.instagramUrl} target="_blank" className="hover:text-[var(--brand-sage)]">Instagram</a>}
              {s.facebookUrl && <a href={s.facebookUrl} target="_blank" className="hover:text-[var(--brand-sage)]">Facebook</a>}
              {s.youtubeUrl && <a href={s.youtubeUrl} target="_blank" className="hover:text-[var(--brand-sage)]">YouTube</a>}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-6 text-center text-sm text-white/60">
          {s.copyrightText}
        </div>
      </div>
    </footer>
  );
}
