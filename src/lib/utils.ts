import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function whatsappLink(number: string, message: string) {
  const clean = number.replace(/[^0-9]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function buildProductWhatsappMessage(
  template: string,
  product: { name: string; weight?: string | null; slug: string }
) {
  const url =
    (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000") +
    `/products/${product.slug}`;
  return template
    .replace("{productName}", product.name)
    .replace("{weight}", product.weight || "")
    .replace("{productUrl}", url)
    .replace("{productSlug}", product.slug);
}
