"use server";
import { prisma } from "./prisma";
import { requireAdmin } from "./auth";
import { slugify } from "./utils";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function createCategory(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name")||"").trim();
  const description = String(formData.get("description")||"");
  const parentId = String(formData.get("parentId")||"") || null;
  const isTopRated = formData.get("isTopRated")==="on";
  const isActive = formData.get("isActive")!=="off";
  const image = String(formData.get("image")||"");
  const rawSlug = String(formData.get("slug")||"");
  let slug = rawSlug ? slugify(rawSlug) : slugify(name);
  // ensure unique
  let base = slug; let i=1;
  while(await prisma.category.findUnique({where:{slug}})) { slug = `${base}-${i++}`;}
  await prisma.category.create({ data:{ name, slug, description: description||null, parentId, isTopRated, isActive, image: image||null, sortOrder: Number(formData.get("sortOrder")||0)}});
  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/categories");
}

export async function updateCategory(id:string, formData: FormData){
  await requireAdmin();
  const name = String(formData.get("name")||"").trim();
  const description = String(formData.get("description")||"");
  const parentId = String(formData.get("parentId")||"") || null;
  const isTopRated = formData.get("isTopRated")==="on";
  const isActive = formData.get("isActive")!=="off";
  const image = String(formData.get("image")||"");
  const slug = slugify(String(formData.get("slug")||name));
  await prisma.category.update({ where:{id}, data:{ name, slug, description: description||null, parentId, isTopRated, isActive, image: image||null, sortOrder: Number(formData.get("sortOrder")||0)}});
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function deleteCategory(id:string){
  await requireAdmin();
  await prisma.category.delete({ where:{id}});
  revalidatePath("/admin/categories");
}

export async function toggleTopRatedCategory(id:string){
  await requireAdmin();
  const c = await prisma.category.findUnique({where:{id}});
  if(!c) return;
  await prisma.category.update({ where:{id}, data:{ isTopRated: !c.isTopRated }});
  revalidatePath("/admin/categories");
}

export async function createProduct(formData: FormData){
  await requireAdmin();
  const name = String(formData.get("name")||"").trim();
  const slugInput = String(formData.get("slug")||"");
  let slug = slugInput ? slugify(slugInput) : slugify(name);
  let base=slug; let i=1;
  while(await prisma.product.findUnique({where:{slug}})) { slug = `${base}-${i++}`;}
  const categoryId = String(formData.get("categoryId")||"");
  if(!categoryId) throw new Error("Category required");
  const weight = String(formData.get("weight")||"") || null;
  const shortDesc = String(formData.get("shortDesc")||"") || null;
  const description = String(formData.get("description")||"") || null;
  const ingredients = String(formData.get("ingredients")||"") || null;
  const howToUse = String(formData.get("howToUse")||"") || null;
  const benefits = String(formData.get("benefits")||"") || null;
  const seoTitle = String(formData.get("seoTitle")||"") || null;
  const seoDesc = String(formData.get("seoDesc")||"") || null;
  const isTopRated = formData.get("isTopRated")==="on";
  const isActive = formData.get("isActive")!=="off";
  const images = String(formData.get("images")||"").split(",").map(s=>s.trim()).filter(Boolean);
  const tagsRaw = String(formData.get("tags")||"").split(",").map(s=>s.trim()).filter(Boolean);
  const attributesRaw = (()=>{ try{ return JSON.parse(String(formData.get("attributes")||"[]")) }catch{return []}})();
  const variantsRaw = (()=>{ try{ return JSON.parse(String(formData.get("variants")||"[]")) }catch{return []}})();

  const product = await prisma.product.create({
    data:{ name, slug, categoryId, weight, shortDesc, description, ingredients, howToUse, benefits, seoTitle, seoDesc, isTopRated, isActive, sortOrder: Number(formData.get("sortOrder")||0) }
  });
  for(let idx=0; idx<images.length; idx++){
    await prisma.productImage.create({ data:{ productId: product.id, url: images[idx], sortOrder: idx, isPrimary: idx===0 }});
  }
  for(const a of attributesRaw){
    if(a.key && a.value) await prisma.productAttribute.create({ data:{ productId: product.id, key:a.key, value:a.value }});
  }
  for(let idx=0; idx<variantsRaw.length; idx++){
    const v=variantsRaw[idx];
    if(v.name) await prisma.productVariant.create({ data:{ productId: product.id, name:v.name, weight:v.weight||null, sku: v.sku||null, image: v.image||null, sortOrder: idx }});
  }
  for(const t of tagsRaw){
    const slugTag = slugify(t);
    let tag = await prisma.tag.findUnique({ where:{ slug: slugTag }});
    if(!tag) tag = await prisma.tag.create({ data:{ name: t, slug: slugTag }});
    await prisma.productTag.create({ data:{ productId: product.id, tagId: tag.id }}).catch(()=>{});
  }
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/products");
}

export async function updateProduct(id:string, formData: FormData){
  await requireAdmin();
  const name = String(formData.get("name")||"").trim();
  const slug = slugify(String(formData.get("slug")||name));
  const categoryId = String(formData.get("categoryId")||"");
  const weight = String(formData.get("weight")||"") || null;
  const shortDesc = String(formData.get("shortDesc")||"") || null;
  const description = String(formData.get("description")||"") || null;
  const ingredients = String(formData.get("ingredients")||"") || null;
  const howToUse = String(formData.get("howToUse")||"") || null;
  const benefits = String(formData.get("benefits")||"") || null;
  const seoTitle = String(formData.get("seoTitle")||"") || null;
  const seoDesc = String(formData.get("seoDesc")||"") || null;
  const isTopRated = formData.get("isTopRated")==="on";
  const isActive = formData.get("isActive")!=="off";
  const images = String(formData.get("images")||"").split(",").map(s=>s.trim()).filter(Boolean);
  const tagsRaw = String(formData.get("tags")||"").split(",").map(s=>s.trim()).filter(Boolean);
  const attributesRaw = (()=>{ try{ return JSON.parse(String(formData.get("attributes")||"[]")) }catch{return []}})();
  const variantsRaw = (()=>{ try{ return JSON.parse(String(formData.get("variants")||"[]")) }catch{return []}})();

  await prisma.product.update({ where:{id}, data:{ name, slug, categoryId, weight, shortDesc, description, ingredients, howToUse, benefits, seoTitle, seoDesc, isTopRated, isActive, sortOrder: Number(formData.get("sortOrder")||0) }});

  await prisma.productImage.deleteMany({ where:{ productId:id }});
  for(let idx=0; idx<images.length; idx++){
    await prisma.productImage.create({ data:{ productId:id, url: images[idx], sortOrder: idx, isPrimary: idx===0 }});
  }
  await prisma.productAttribute.deleteMany({ where:{ productId:id }});
  for(const a of attributesRaw){
    if(a.key && a.value) await prisma.productAttribute.create({ data:{ productId:id, key:a.key, value:a.value }});
  }
  await prisma.productVariant.deleteMany({ where:{ productId:id }});
  for(let idx=0; idx<variantsRaw.length; idx++){
    const v=variantsRaw[idx];
    if(v.name) await prisma.productVariant.create({ data:{ productId:id, name:v.name, weight:v.weight||null, sku: v.sku||null, image: v.image||null, sortOrder: idx }});
  }
  await prisma.productTag.deleteMany({ where:{ productId:id }});
  for(const t of tagsRaw){
    const slugTag = slugify(t);
    let tag = await prisma.tag.findUnique({ where:{ slug: slugTag }});
    if(!tag) tag = await prisma.tag.create({ data:{ name: t, slug: slugTag }});
    await prisma.productTag.create({ data:{ productId:id, tagId: tag.id }}).catch(()=>{});
  }
  revalidatePath("/admin/products");
  revalidatePath(`/products/${slug}`);
}

export async function deleteProduct(id:string){
  await requireAdmin();
  await prisma.product.delete({ where:{id}});
  revalidatePath("/admin/products");
}

export async function updateSettings(formData: FormData){
  await requireAdmin();
  const data: any = {};
  for(const key of ["logoUrl","headerAnnouncement","headerQuote","footerHeadline","footerDesc","address","phone","email","gstNumber","copyrightText","businessHours","mapEmbedUrl","whatsappNumber","whatsappDefaultMsg","whatsappProductTemplate","instagramUrl","facebookUrl","youtubeUrl","linkedinUrl"]){
    const v = formData.get(key);
    if(v!==null) {
      const s = String(v).trim();
      data[key]= s ? s : null;
    }
  }
  // siteName can be empty — allow "" (user requested). Keep as String (empty allowed)
  const siteNameRaw = String(formData.get("siteName") ?? "");
  // Do not trim aggressively for empty check — allow empty string to be saved as ""
  // Trim only for consistency, but keep empty as "" (not null)
  data.siteName = siteNameRaw.trim();

  data.whatsappEnabled = formData.get("whatsappEnabled")==="on";
  data.blogEnabled = formData.get("blogEnabled")==="on";
  await prisma.websiteSettings.upsert({ where:{id:"settings"}, update: data, create:{ id:"settings", ...data }});
  revalidatePath("/");
  revalidatePath("/contact");
}

export async function createBanner(formData: FormData){
  await requireAdmin();
  await prisma.banner.create({
    data:{
      title: String(formData.get("title")||""),
      subtitle: String(formData.get("subtitle")||"")||null,
      ctaText: String(formData.get("ctaText")||"")||null,
      ctaLink: String(formData.get("ctaLink")||"")||null,
      desktopUrl: String(formData.get("desktopUrl")||""),
      mobileUrl: String(formData.get("mobileUrl")||"")||null,
      sortOrder: Number(formData.get("sortOrder")||0),
      isActive: formData.get("isActive")!=="off",
    }
  });
  revalidatePath("/");
  revalidatePath("/admin/banners");
}

export async function deleteBanner(id:string){
  await requireAdmin();
  await prisma.banner.delete({ where:{id}});
  revalidatePath("/");
}

export async function updateEnquiryStatus(id:string, status:string){
  await requireAdmin();
  await prisma.contactSubmission.update({ where:{id}, data:{ status }});
  revalidatePath("/admin/enquiries");
}

export async function deleteEnquiry(id:string){
  await requireAdmin();
  await prisma.contactSubmission.delete({ where:{id}});
  revalidatePath("/admin/enquiries");
}

export async function createBlog(formData: FormData){
  await requireAdmin();
  const title = String(formData.get("title")||"");
  let slug = slugify(String(formData.get("slug")||title));
  let base=slug; let i=1;
  while(await prisma.blogPost.findUnique({where:{slug}})) slug = `${base}-${i++}`;
  await prisma.blogPost.create({
    data:{
      title, slug,
      excerpt: String(formData.get("excerpt")||"")||null,
      content: String(formData.get("content")||"")||null,
      coverImage: String(formData.get("coverImage")||"")||null,
      seoTitle: String(formData.get("seoTitle")||"")||null,
      seoDesc: String(formData.get("seoDesc")||"")||null,
      isPublished: formData.get("isPublished")==="on",
      publishedAt: formData.get("isPublished")==="on" ? new Date() : null,
    }
  });
  revalidatePath("/blogs");
  revalidatePath("/admin/blogs");
}

export async function deleteBlog(id:string){
  await requireAdmin();
  await prisma.blogPost.delete({ where:{id}});
  revalidatePath("/admin/blogs");
}
