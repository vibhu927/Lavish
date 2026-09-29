// Row types for the JSON data layer. These mirror the former Prisma models
// so every call site keeps the type safety it had before the migration.

export type AdminUser = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
  isTopRated: boolean;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  shortDesc: string | null;
  description: string | null;
  categoryId: string;
  weight: string | null;
  ingredients: string | null;
  howToUse: string | null;
  benefits: string | null;
  isActive: boolean;
  isTopRated: boolean;
  sortOrder: number;
  seoTitle: string | null;
  seoDesc: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductImage = {
  id: string;
  productId: string;
  url: string;
  sortOrder: number;
  isPrimary: boolean;
  alt: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductVariant = {
  id: string;
  productId: string;
  name: string;
  sku: string | null;
  weight: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductAttribute = {
  id: string;
  productId: string;
  key: string;
  value: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductTag = {
  productId: string;
  tagId: string;
  createdAt: Date;
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  desktopUrl: string;
  mobileUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  coverImage: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  seoTitle: string | null;
  seoDesc: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  productId: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type WebsiteSettings = {
  id: string;
  siteName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  defaultSeoTitle: string | null;
  defaultSeoDesc: string | null;
  headerAnnouncement: string | null;
  headerQuote: string | null;
  footerHeadline: string | null;
  footerDesc: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  gstNumber: string | null;
  copyrightText: string | null;
  businessHours: string | null;
  mapEmbedUrl: string | null;
  whatsappEnabled: boolean;
  whatsappNumber: string | null;
  whatsappDefaultMsg: string | null;
  whatsappProductTemplate: string | null;
  blogEnabled: boolean;
  instagramUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  linkedinUrl: string | null;
  updatedAt: Date;
};

export type MediaAsset = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  hash: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Entities = {
  adminUser: AdminUser;
  category: Category;
  product: Product;
  productImage: ProductImage;
  productVariant: ProductVariant;
  productAttribute: ProductAttribute;
  tag: Tag;
  productTag: ProductTag;
  banner: Banner;
  blogPost: BlogPost;
  contactSubmission: ContactSubmission;
  websiteSettings: WebsiteSettings;
  mediaAsset: MediaAsset;
};

export type ModelName = keyof Entities;
