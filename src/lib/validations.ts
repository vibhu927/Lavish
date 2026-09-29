import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(80).optional(),
  description: z.string().max(500).optional(),
  image: z.string().optional(),
  parentId: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  isTopRated: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
});

export const productSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120).optional(),
  shortDesc: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  categoryId: z.string().min(1),
  weight: z.string().max(50).optional(),
  ingredients: z.string().max(2000).optional(),
  howToUse: z.string().max(2000).optional(),
  benefits: z.string().max(2000).optional(),
  seoTitle: z.string().max(70).optional(),
  seoDesc: z.string().max(160).optional(),
  isActive: z.boolean().default(true),
  isTopRated: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  images: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  attributes: z
    .array(z.object({ key: z.string().min(1), value: z.string().min(1) }))
    .default([]),
  variants: z
    .array(
      z.object({
        name: z.string().min(1),
        weight: z.string().optional(),
        sku: z.string().optional(),
        image: z.string().optional(),
      })
    )
    .default([]),
});

export const bannerSchema = z.object({
  title: z.string().min(2).max(120),
  subtitle: z.string().max(200).optional(),
  ctaText: z.string().max(30).optional(),
  ctaLink: z.string().max(200).optional(),
  desktopUrl: z.string().min(1),
  mobileUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const blogSchema = z.object({
  title: z.string().min(2).max(150),
  slug: z.string().min(2).max(150).optional(),
  excerpt: z.string().max(300).optional(),
  content: z.string().max(20000).optional(),
  coverImage: z.string().optional(),
  isPublished: z.boolean().default(false),
  seoTitle: z.string().max(70).optional(),
  seoDesc: z.string().max(160).optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  subject: z.string().max(120).optional(),
  message: z.string().min(10).max(2000),
  productId: z.string().optional(),
});

export const settingsSchema = z.object({
  siteName: z.string().min(2).max(80),
  logoUrl: z.string().optional(),
  headerAnnouncement: z.string().max(120).optional(),
  headerQuote: z.string().max(120).optional(),
  footerHeadline: z.string().max(80).optional(),
  footerDesc: z.string().max(500).optional(),
  address: z.string().max(300).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal("")),
  gstNumber: z.string().max(30).optional(),
  copyrightText: z.string().max(120).optional(),
  businessHours: z.string().max(100).optional(),
  mapEmbedUrl: z.string().max(1000).optional(),
  whatsappEnabled: z.boolean(),
  whatsappNumber: z.string().max(20).optional(),
  whatsappDefaultMsg: z.string().max(500).optional(),
  whatsappProductTemplate: z.string().max(500).optional(),
  blogEnabled: z.boolean(),
  instagramUrl: z.string().max(200).optional(),
  facebookUrl: z.string().max(200).optional(),
  youtubeUrl: z.string().max(200).optional(),
  linkedinUrl: z.string().max(200).optional(),
});
