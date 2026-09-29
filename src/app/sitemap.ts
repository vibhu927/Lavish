import { prisma } from "@/lib/prisma";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const [cats, products, blogs] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.blogPost.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
  ]);
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/products`, lastModified: now },
    { url: `${base}/categories`, lastModified: now },
    { url: `${base}/contact`, lastModified: now },
    ...cats.map((c) => ({ url: `${base}/categories/${c.slug}`, lastModified: c.updatedAt })),
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updatedAt })),
    ...blogs.map((b) => ({ url: `${base}/blogs/${b.slug}`, lastModified: b.updatedAt })),
  ];
}
