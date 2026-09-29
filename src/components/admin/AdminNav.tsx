"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/blogs", label: "Blogs" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="space-y-1">
      {nav.map((n) => {
        const active = path === n.href || (n.href !== "/admin" && path.startsWith(n.href));
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`block rounded-xl px-3 py-2 text-sm font-medium ${active ? "bg-[var(--brand-charcoal)] text-white" : "text-zinc-600 hover:bg-white"}`}
          >
            {n.label}
          </Link>
        );
      })}
      <form action="/api/admin/logout" method="post" className="pt-4">
        <button formAction={async () => { await fetch("/api/admin/logout", { method: "POST" }); window.location.href = "/admin/login"; }} className="text-sm text-red-600 hover:underline">
          Logout
        </button>
      </form>
    </nav>
  );
}
