import { db } from "../src/lib/db/client";
import bcrypt from "bcryptjs";

const prisma = db;

// Override on a live server: ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:seed
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@leaforganic.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

async function main() {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.adminUser.upsert({
    where: { email: ADMIN_EMAIL.toLowerCase() },
    update: {},
    create: { email: ADMIN_EMAIL.toLowerCase(), name: "Admin", passwordHash: hash, role: "ADMIN" },
  });

  await prisma.websiteSettings.upsert({
    where: { id: "settings" },
    update: {},
    create: {
      id: "settings",
      siteName: "Leaf Organic",
      headerAnnouncement: "Free shipping on orders above ₹999 — Pan India",
      headerQuote: "Pure Beauty, Naturally",
      footerHeadline: "Leaf Organic",
      footerDesc: "Handcrafted beauty with organic ingredients. Cruelty-free, sustainable, and made with love in India.",
      address: "12 Green Valley, Shahpur Jat, New Delhi 110049",
      phone: "+91 98765 43210",
      email: "hello@leaforganic.com",
      gstNumber: "07ABCDE1234F1Z5",
      copyrightText: "© 2026 Leaf Organic. Crafted with care.",
      businessHours: "Mon–Sat: 10am – 7pm IST",
      whatsappNumber: "919876543210",
      whatsappEnabled: true,
      whatsappDefaultMsg: "Hi, I want to know more about your products.",
      whatsappProductTemplate: "Hi, I want more information about {productName} ({weight}) — {productUrl}",
      blogEnabled: true,
      instagramUrl: "https://instagram.com",
      facebookUrl: "https://facebook.com",
      youtubeUrl: "https://youtube.com",
    },
  });

  // Tags
  const tagNames = ["organic", "vegan", "cruelty-free", "ayurvedic", "natural", "handmade"];
  for (const n of tagNames) {
    await prisma.tag.upsert({
      where: { slug: n },
      update: {},
      create: { name: n.charAt(0).toUpperCase() + n.slice(1), slug: n },
    });
  }

  // Categories
  const cats = [
    { name: "Skincare", slug: "skincare", desc: "Natural skincare for radiant skin", isTopRated: true, sortOrder: 1 },
    { name: "Hair Care", slug: "hair-care", desc: "Nourish your hair, naturally", isTopRated: true, sortOrder: 2 },
    { name: "Body Care", slug: "body-care", desc: "Indulge your body with organic goodness", sortOrder: 3 },
    { name: "Lip Care", slug: "lip-care", desc: "Soft, nourished lips", sortOrder: 4 },
  ];
  for (const c of cats) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        name: c.name,
        slug: c.slug,
        description: c.desc,
        isTopRated: c.isTopRated ?? false,
        sortOrder: c.sortOrder,
        image: "/uploads/general/placeholder.jpg",
      },
    });
  }
  // Subcategories
  const skincare = await prisma.category.findUnique({ where: { slug: "skincare" } });
  if (skincare) {
    for (const sub of [
      { name: "Cleansers", slug: "cleansers" },
      { name: "Moisturizers", slug: "moisturizers" },
      { name: "Serums", slug: "serums" },
    ]) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: {},
        create: { name: sub.name, slug: sub.slug, parentId: skincare.id, sortOrder: 10 },
      });
    }
  }

  const skincareCat = await prisma.category.findUnique({ where: { slug: "skincare" } });
  const hairCat = await prisma.category.findUnique({ where: { slug: "hair-care" } });
  const lipCat = await prisma.category.findUnique({ where: { slug: "lip-care" } });
  const allTags = await prisma.tag.findMany();

  type SeedProduct = {
    name: string;
    slug: string;
    shortDesc: string;
    weight: string;
    categoryId: string;
    isTopRated?: boolean;
    attributes?: { key: string; value: string }[];
    images: string[];
    variants: { name: string; weight: string }[];
  };

  const productsData: SeedProduct[] = [
    {
      name: "Rose & Saffron Glow Serum",
      slug: "rose-saffron-glow-serum",
      shortDesc: "Radiance-boosting serum with wild rose & saffron",
      weight: "30ml",
      categoryId: skincareCat?.id || "",
      isTopRated: true,
      attributes: [
        { key: "Skin Type", value: "All Skin Types" },
        { key: "Finish", value: "Dewy" },
      ],
      images: ["/uploads/products/serum1.jpg"],
      variants: [
        { name: "30ml", weight: "30ml" },
        { name: "50ml", weight: "50ml" },
      ],
    },
    {
      name: "Neem & Tea Tree Purifying Cleanser",
      slug: "neem-tea-tree-cleanser",
      shortDesc: "Gentle daily cleanser for clear skin",
      weight: "100ml",
      categoryId: skincareCat?.id || "",
      attributes: [{ key: "Concern", value: "Acne & Oily Skin" }],
      images: ["/uploads/products/cleanser1.jpg"],
      variants: [],
    },
    {
      name: "Coconut & Hibiscus Hair Oil",
      slug: "coconut-hibiscus-hair-oil",
      shortDesc: "Cold-pressed oil for strong, shiny hair",
      weight: "100ml",
      categoryId: hairCat?.id || "",
      isTopRated: true,
      images: ["/uploads/products/hairoil1.jpg"],
      variants: [{ name: "100ml", weight: "100ml" }, { name: "200ml", weight: "200ml" }],
    },
    {
      name: "Beetroot Lip & Cheek Tint",
      slug: "beetroot-lip-cheek-tint",
      shortDesc: "Natural tint with beetroot & kokum butter",
      weight: "8g",
      categoryId: lipCat?.id || "",
      isTopRated: true,
      images: ["/uploads/products/liptint1.jpg"],
      variants: [
        { name: "Rose Pink", weight: "8g" },
        { name: "Berry Red", weight: "8g" },
        { name: "Coral Peach", weight: "8g" },
      ],
    },
  ];

  for (const p of productsData) {
    const exists = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (exists) continue;
    const prod = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        shortDesc: p.shortDesc,
        description: `${p.shortDesc}. Handcrafted with organic ingredients, cruelty-free and sustainably made.`,
        categoryId: p.categoryId,
        weight: p.weight,
        ingredients: "Rosehip Oil, Saffron Extract, Aloe Vera, Vitamin E",
        howToUse: "Apply 2-3 drops on clean skin, morning & night. Gently massage.",
        benefits: "Boosts glow, evens tone, hydrates deeply.",
        isTopRated: p.isTopRated ?? false,
        sortOrder: 0,
      },
    });
    for (let i = 0; i < p.images.length; i++) {
      await prisma.productImage.create({
        data: { productId: prod.id, url: p.images[i], sortOrder: i, isPrimary: i === 0 },
      });
    }
    for (const a of p.attributes ?? []) {
      await prisma.productAttribute.create({ data: { productId: prod.id, key: a.key, value: a.value } });
    }
    for (const v of p.variants ?? []) {
      await prisma.productVariant.create({ data: { productId: prod.id, name: v.name, weight: v.weight } });
    }
    // attach 2 random tags
    for (const t of allTags.slice(0, 2)) {
      await prisma.productTag.create({ data: { productId: prod.id, tagId: t.id } }).catch(() => {});
    }
  }

  // Banners
  await prisma.banner.upsert({
    where: { id: "banner1" },
    update: {},
    create: {
      id: "banner1",
      title: "Pure Beauty, Naturally",
      subtitle: "Discover organic skincare handcrafted with love",
      ctaText: "Explore Collection",
      ctaLink: "/products",
      desktopUrl: "/uploads/general/banner1.jpg",
      sortOrder: 1,
      isActive: true,
    },
  });

  // Blog
  await prisma.blogPost.upsert({
    where: { slug: "5-reasons-to-switch-to-organic-skincare" },
    update: {},
    create: {
      title: "5 Reasons to Switch to Organic Skincare",
      slug: "5-reasons-to-switch-to-organic-skincare",
      excerpt: "Why organic ingredients make a difference for your skin and the planet.",
      content: "Organic skincare is free from harsh chemicals, sustainably sourced, and packed with antioxidants...",
      coverImage: "/uploads/general/blog1.jpg",
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  console.log(`Seed done. Admin: ${ADMIN_EMAIL.toLowerCase()}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
