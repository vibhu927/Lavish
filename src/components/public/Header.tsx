import Link from "next/link";
import Image from "next/image";
import { getSettings } from "@/lib/settings";

export async function Header() {
  const settings = await getSettings();
  const blogOn = settings.blogEnabled;
  return (
    <header className="sticky top-0 z-40 bg-[var(--brand-charcoal)] text-white">
      {settings.headerAnnouncement && (
        <div className="bg-[var(--brand-sage)] text-white text-center text-xs sm:text-sm py-2 px-4 tracking-wide">
          {settings.headerAnnouncement}
        </div>
      )}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-28 md:h-32 items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <img src={settings.logoUrl || "/logo.jpg"} alt={settings.siteName || "Leaf Organic"} className="h-20 md:h-28 w-auto object-contain" />
            {settings.siteName?.trim() ? (
              settings.siteName.trim() === "Leaf Organic" ? (
                <span className="font-display text-2xl tracking-tight">Leaf<span className="text-[var(--brand-sage)]"> Organic</span></span>
              ) : (
                <span className="font-display text-2xl tracking-tight">{settings.siteName}</span>
              )
            ) : null}
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/categories" className="hover:text-[var(--brand-sage)] transition">Categories</Link>
            <Link href="/products" className="hover:text-[var(--brand-sage)] transition">Products</Link>
            {blogOn && <Link href="/blogs" className="hover:text-[var(--brand-sage)] transition">Blogs</Link>}
            <Link href="/contact" className="hover:text-[var(--brand-sage)] transition">Contact</Link>
          </nav>
          <div className="flex items-center gap-3">
            {settings.whatsappEnabled && settings.whatsappNumber && (
              <a href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g,"")}?text=${encodeURIComponent(settings.whatsappDefaultMsg||"Hi")}`} target="_blank" className="hidden sm:inline-flex bg-[var(--brand-leaf)] hover:bg-[var(--brand-sage)] text-white rounded-full px-5 py-2 text-sm font-medium transition">
                WhatsApp
              </a>
            )}
            <Link href="/contact" className="bg-white text-[var(--brand-charcoal)] rounded-full px-5 py-2 text-sm font-medium hover:bg-[var(--brand-sage-light)] transition">Enquire</Link>
          </div>
        </div>
        {/* mobile nav */}
        <div className="md:hidden flex items-center gap-4 pb-3 text-sm overflow-x-auto">
          <Link href="/categories" className="whitespace-nowrap">Categories</Link>
          <Link href="/products" className="whitespace-nowrap">Products</Link>
          {blogOn && <Link href="/blogs" className="whitespace-nowrap">Blogs</Link>}
          <Link href="/contact" className="whitespace-nowrap">Contact</Link>
        </div>
      </div>
    </header>
  );
}
