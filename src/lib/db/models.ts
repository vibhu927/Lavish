// Model definitions mirroring the former prisma/schema.prisma.
// This is the single source of truth for the JSON data layer.

export type ScalarType = "string" | "int" | "boolean" | "datetime";

export type FieldDef = {
  type: ScalarType;
  /** static default applied on create when the field is absent */
  default?: unknown;
  /** generate a cuid-style id on create */
  autoId?: boolean;
  /** unique constraint; single field or composite across the model */
  unique?: boolean;
  /** Prisma @updatedAt — refreshed on every update */
  updatedAt?: boolean;
};

export type RelationDef =
  | { kind: "one"; model: string; localField: string; optional?: boolean }
  | { kind: "many"; model: string; foreignField: string };

export type ModelDef = {
  /** camelCase model name, matches every prisma.<model> call site */
  name: string;
  /** primary key: one field name, or several for a composite key */
  pk: string | string[];
  fields: Record<string, FieldDef>;
  relations?: Record<string, RelationDef>;
};

export const MODELS = {
  adminUser: {
    name: "adminUser",
    pk: "id",
    fields: {
      id: { type: "string", autoId: true },
      email: { type: "string", unique: true },
      passwordHash: { type: "string" },
      name: { type: "string" },
      role: { type: "string", default: "ADMIN" },
      createdAt: { type: "datetime" },
      updatedAt: { type: "datetime", updatedAt: true },
    },
  },

  category: {
    name: "category",
    pk: "id",
    fields: {
      id: { type: "string", autoId: true },
      name: { type: "string" },
      slug: { type: "string", unique: true },
      description: { type: "string" },
      image: { type: "string" },
      sortOrder: { type: "int", default: 0 },
      isActive: { type: "boolean", default: true },
      isTopRated: { type: "boolean", default: false },
      parentId: { type: "string" },
      createdAt: { type: "datetime" },
      updatedAt: { type: "datetime", updatedAt: true },
    },
    relations: {
      parent: { kind: "one", model: "category", localField: "parentId", optional: true },
      children: { kind: "many", model: "category", foreignField: "parentId" },
      products: { kind: "many", model: "product", foreignField: "categoryId" },
    },
  },

  product: {
    name: "product",
    pk: "id",
    fields: {
      id: { type: "string", autoId: true },
      name: { type: "string" },
      slug: { type: "string", unique: true },
      shortDesc: { type: "string" },
      description: { type: "string" },
      categoryId: { type: "string" },
      weight: { type: "string" },
      ingredients: { type: "string" },
      howToUse: { type: "string" },
      benefits: { type: "string" },
      isActive: { type: "boolean", default: true },
      isTopRated: { type: "boolean", default: false },
      sortOrder: { type: "int", default: 0 },
      seoTitle: { type: "string" },
      seoDesc: { type: "string" },
      createdAt: { type: "datetime" },
      updatedAt: { type: "datetime", updatedAt: true },
    },
    relations: {
      category: { kind: "one", model: "category", localField: "categoryId" },
      images: { kind: "many", model: "productImage", foreignField: "productId" },
      variants: { kind: "many", model: "productVariant", foreignField: "productId" },
      attributes: { kind: "many", model: "productAttribute", foreignField: "productId" },
      tags: { kind: "many", model: "productTag", foreignField: "productId" },
    },
  },

  productImage: {
    name: "productImage",
    pk: "id",
    fields: {
      id: { type: "string", autoId: true },
      productId: { type: "string" },
      url: { type: "string" },
      sortOrder: { type: "int", default: 0 },
      isPrimary: { type: "boolean", default: false },
      alt: { type: "string" },
      createdAt: { type: "datetime" },
      updatedAt: { type: "datetime", updatedAt: true },
    },
  },

  productVariant: {
    name: "productVariant",
    pk: "id",
    fields: {
      id: { type: "string", autoId: true },
      productId: { type: "string" },
      name: { type: "string" },
      sku: { type: "string", unique: true },
      weight: { type: "string" },
      image: { type: "string" },
      isActive: { type: "boolean", default: true },
      sortOrder: { type: "int", default: 0 },
      createdAt: { type: "datetime" },
      updatedAt: { type: "datetime", updatedAt: true },
    },
  },

  productAttribute: {
    name: "productAttribute",
    pk: "id",
    fields: {
      id: { type: "string", autoId: true },
      productId: { type: "string" },
      key: { type: "string" },
      value: { type: "string" },
      sortOrder: { type: "int", default: 0 },
      createdAt: { type: "datetime" },
      updatedAt: { type: "datetime", updatedAt: true },
    },
  },

  tag: {
    name: "tag",
    pk: "id",
    fields: {
      id: { type: "string", autoId: true },
      name: { type: "string", unique: true },
      slug: { type: "string", unique: true },
      createdAt: { type: "datetime" },
      updatedAt: { type: "datetime", updatedAt: true },
    },
  },

  productTag: {
    name: "productTag",
    // composite primary key — no surrogate id
    pk: ["productId", "tagId"],
    fields: {
      productId: { type: "string" },
      tagId: { type: "string" },
      createdAt: { type: "datetime" },
    },
    relations: {
      tag: { kind: "one", model: "tag", localField: "tagId" },
      product: { kind: "one", model: "product", localField: "productId" },
    },
  },

  banner: {
    name: "banner",
    pk: "id",
    fields: {
      id: { type: "string", autoId: true },
      title: { type: "string" },
      subtitle: { type: "string" },
      ctaText: { type: "string" },
      ctaLink: { type: "string" },
      desktopUrl: { type: "string" },
      mobileUrl: { type: "string" },
      sortOrder: { type: "int", default: 0 },
      isActive: { type: "boolean", default: true },
      createdAt: { type: "datetime" },
      updatedAt: { type: "datetime", updatedAt: true },
    },
  },

  blogPost: {
    name: "blogPost",
    pk: "id",
    fields: {
      id: { type: "string", autoId: true },
      title: { type: "string" },
      slug: { type: "string", unique: true },
      excerpt: { type: "string" },
      content: { type: "string" },
      coverImage: { type: "string" },
      isPublished: { type: "boolean", default: false },
      publishedAt: { type: "datetime" },
      seoTitle: { type: "string" },
      seoDesc: { type: "string" },
      createdAt: { type: "datetime" },
      updatedAt: { type: "datetime", updatedAt: true },
    },
  },

  contactSubmission: {
    name: "contactSubmission",
    pk: "id",
    fields: {
      id: { type: "string", autoId: true },
      name: { type: "string" },
      email: { type: "string" },
      phone: { type: "string" },
      subject: { type: "string" },
      message: { type: "string" },
      productId: { type: "string" },
      status: { type: "string", default: "NEW" },
      createdAt: { type: "datetime" },
      updatedAt: { type: "datetime", updatedAt: true },
    },
  },

  websiteSettings: {
    name: "websiteSettings",
    pk: "id",
    fields: {
      id: { type: "string", default: "settings" },
      siteName: { type: "string", default: "Leaf Organic" },
      logoUrl: { type: "string" },
      faviconUrl: { type: "string" },
      defaultSeoTitle: { type: "string", default: "Leaf Organic — Pure Beauty, Naturally" },
      defaultSeoDesc: { type: "string", default: "Organic beauty & cosmetics by Leaf Organic." },
      headerAnnouncement: { type: "string", default: "Free shipping on orders above ₹999" },
      headerQuote: { type: "string", default: "Pure Beauty, Naturally" },
      footerHeadline: { type: "string", default: "Leaf Organic" },
      footerDesc: {
        type: "string",
        default:
          "Handcrafted beauty with organic ingredients. Cruelty-free, sustainable, and made with love.",
      },
      address: { type: "string", default: "123 Green Valley, New Delhi, India" },
      phone: { type: "string", default: "+91 98765 43210" },
      email: { type: "string", default: "hello@leaforganic.com" },
      gstNumber: { type: "string", default: "" },
      copyrightText: { type: "string", default: "© 2026 Leaf Organic. All rights reserved." },
      businessHours: { type: "string", default: "Mon–Sat: 10am – 7pm" },
      mapEmbedUrl: { type: "string" },
      whatsappEnabled: { type: "boolean", default: true },
      whatsappNumber: { type: "string", default: "919876543210" },
      whatsappDefaultMsg: { type: "string", default: "Hi, I want to know more about your products." },
      whatsappProductTemplate: {
        type: "string",
        default: "Hi, I want more information about {productName} ({weight}) — {productUrl}",
      },
      blogEnabled: { type: "boolean", default: true },
      instagramUrl: { type: "string" },
      facebookUrl: { type: "string" },
      youtubeUrl: { type: "string" },
      linkedinUrl: { type: "string" },
      updatedAt: { type: "datetime", updatedAt: true },
    },
  },

  mediaAsset: {
    name: "mediaAsset",
    pk: "id",
    fields: {
      id: { type: "string", autoId: true },
      url: { type: "string", unique: true },
      filename: { type: "string" },
      mimeType: { type: "string" },
      size: { type: "int" },
      hash: { type: "string" },
      createdAt: { type: "datetime" },
      updatedAt: { type: "datetime", updatedAt: true },
    },
  },
} as const satisfies Record<string, ModelDef>;

export type ModelDefs = typeof MODELS;
export type ModelName = keyof ModelDefs;
export const MODEL_NAMES = Object.keys(MODELS) as ModelName[];

/** Widened accessor for lookups by a runtime string. */
export function modelDef(name: string): ModelDef {
  return MODELS[name as ModelName] as ModelDef;
}

/** cuid-ish id: sortable, collision-resistant, no dependency */
export function newId(): string {
  const ts = Date.now().toString(36);
  const rand = Array.from({ length: 12 }, () => Math.floor(Math.random() * 36).toString(36)).join("");
  return `c${ts}${rand}`;
}
