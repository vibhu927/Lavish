"use client";
import { useState, useTransition } from "react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { friendlyActionError } from "@/lib/action-error";

export function ProductForm({ categories, initial, action }: { categories: any[]; initial?: any; action: (fd: FormData) => Promise<void> }) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [images, setImages] = useState<string[]>(initial?.images?.map((i: any) => i.url) || []);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState(initial?.tagsString || (initial?.tags?.map((t: any) => t.tag?.name).join(", ") || ""));
  const [attrs, setAttrs] = useState<{ key: string; value: string }[]>(initial?.attributes || []);
  const [variants, setVariants] = useState<any[]>(initial?.variants || []);
  const [showPreview, setShowPreview] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "products");
        let res: Response;
        try {
          res = await fetch("/api/upload", { method: "POST", body: fd });
        } catch {
          toast(`Upload failed for ${file.name}: network error`, "error");
          continue;
        }
        let data: { url?: string; error?: string } | null = null;
        try {
          data = await res.json();
        } catch {
          // non-JSON error body
        }
        const url = data?.url;
        if (res.ok && url) {
          setImages((prev) => [...prev, url]);
        } else {
          toast(`Upload failed for ${file.name}: ${data?.error || `server returned ${res.status}`}`, "error");
        }
      }
    } finally {
      setUploading(false);
      // Allow re-selecting the same file after a failed attempt.
      e.target.value = "";
    }
  }

  function addAttr() { setAttrs([...attrs, { key: "", value: "" }]); }
  function addVariant() { setVariants([...variants, { name: "", weight: "", sku: "", image: "" }]); }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData);
        toast(initial ? "Product updated ✓" : "Product created ✓", "success");
      } catch (e) {
        toast(friendlyActionError(e, "Failed to save product"), "error");
      }
    });
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <form action={handleSubmit} className="lg:col-span-2 bg-white rounded-2xl border border-[var(--brand-muted)] p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Name*</Label><Input name="name" defaultValue={initial?.name} required /></div>
          <div><Label>Slug (auto)</Label><Input name="slug" defaultValue={initial?.slug} placeholder="auto" /></div>
        </div>
        <div>
          <Label>Category*</Label>
          <select name="categoryId" defaultValue={initial?.categoryId} required className="w-full h-10 rounded-xl border border-[var(--brand-muted)] bg-white px-3 text-sm">
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Weight (e.g. 30ml, 50g)</Label><Input name="weight" defaultValue={initial?.weight||""} placeholder="30ml" /></div>
          <div><Label>Sort Order</Label><Input name="sortOrder" type="number" defaultValue={initial?.sortOrder ?? 0} /></div>
        </div>
        <div><Label>Short Description (card)</Label><Input name="shortDesc" defaultValue={initial?.shortDesc||""} maxLength={200} placeholder="One-line benefit" /></div>
        <div><Label>Description</Label><Textarea name="description" defaultValue={initial?.description||""} placeholder="Full product story, benefits..." rows={4} /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Ingredients</Label><Textarea name="ingredients" defaultValue={initial?.ingredients||""} rows={2} placeholder="Aloe Vera, Rosehip..." /></div>
          <div><Label>How to Use</Label><Textarea name="howToUse" defaultValue={initial?.howToUse||""} rows={2} placeholder="Apply 2-3 drops..." /></div>
        </div>
        <div><Label>Benefits</Label><Textarea name="benefits" defaultValue={initial?.benefits||""} rows={2} /></div>

        {/* Images */}
        <div>
          <Label>Product Images (multiple, first is primary)</Label>
          <input type="file" multiple accept="image/*" onChange={handleUpload} className="text-sm mt-1" />
          {uploading && <p className="text-sm text-zinc-500">Uploading...</p>}
          <div className="flex flex-wrap gap-2 mt-3">
            {images.map((url, idx) => (
              <div key={idx} className="relative">
                <img src={url} alt="" className="h-20 w-20 object-cover rounded-xl border" />
                <button type="button" onClick={() => setImages(images.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 text-xs">×</button>
                {idx===0 && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[var(--brand-sage)] text-white text-[10px] px-1 rounded">Primary</span>}
              </div>
            ))}
          </div>
          <input type="hidden" name="images" value={images.join(",")} />
          <p className="text-xs text-zinc-400 mt-2">Drag to reorder by re-uploading in order. Stored locally at /uploads/products/</p>
        </div>

        <div>
          <Label>Tags (comma separated — e.g. vegan, organic)</Label>
          <Input name="tags" value={tags} onChange={(e)=>setTags(e.target.value)} placeholder="vegan, organic, cruelty-free" />
        </div>

        {/* Attributes */}
        <div>
          <Label>Attributes / Specifications</Label>
          {attrs.map((a, i) => (
            <div key={i} className="flex gap-2 mt-2">
              <Input placeholder="Key (e.g. Skin Type)" value={a.key} onChange={(e)=>{ const n=[...attrs]; n[i].key=e.target.value; setAttrs(n); }} />
              <Input placeholder="Value (e.g. All Skin Types)" value={a.value} onChange={(e)=>{ const n=[...attrs]; n[i].value=e.target.value; setAttrs(n); }} />
              <button type="button" onClick={()=> setAttrs(attrs.filter((_,idx)=>idx!==i))} className="text-red-600 text-sm px-2">✕</button>
            </div>
          ))}
          <button type="button" onClick={addAttr} className="text-sm text-[var(--brand-leaf)] mt-2">+ Add attribute</button>
          <input type="hidden" name="attributes" value={JSON.stringify(attrs)} />
        </div>

        {/* Variants */}
        <div>
          <Label>Variants (shade / size)</Label>
          {variants.map((v,i)=> (
            <div key={i} className="flex gap-2 mt-2">
              <Input placeholder="Name (Ruby Red)" value={v.name} onChange={(e)=>{ const n=[...variants]; n[i].name=e.target.value; setVariants(n);}} />
              <Input placeholder="Weight (8g)" value={v.weight} onChange={(e)=>{ const n=[...variants]; n[i].weight=e.target.value; setVariants(n);}} className="w-24" />
              <Input placeholder="SKU" value={v.sku||""} onChange={(e)=>{ const n=[...variants]; n[i].sku=e.target.value; setVariants(n);}} className="w-24" />
              <button type="button" onClick={()=> setVariants(variants.filter((_,idx)=>idx!==i))} className="text-red-600 text-sm">✕</button>
            </div>
          ))}
          <button type="button" onClick={addVariant} className="text-sm text-[var(--brand-leaf)] mt-2">+ Add variant</button>
          <input type="hidden" name="variants" value={JSON.stringify(variants)} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>SEO Title</Label><Input name="seoTitle" defaultValue={initial?.seoTitle||""} maxLength={70} /></div>
          <div><Label>SEO Description</Label><Input name="seoDesc" defaultValue={initial?.seoDesc||""} maxLength={160} /></div>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isTopRated" defaultChecked={initial?.isTopRated} /> Top Rated</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? true} /> Active</label>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={pending} className="flex-1">{pending ? "Saving..." : initial ? "Update Product" : "Create Product"}</Button>
          <Button type="button" variant="secondary" onClick={()=> setShowPreview(!showPreview)}>{showPreview?"Hide Preview":"Preview"}</Button>
        </div>
      </form>

      {/* Preview */}
      {showPreview && (
        <div className="bg-white rounded-2xl border border-[var(--brand-muted)] p-6 h-fit sticky top-6">
          <h3 className="font-medium mb-4">Preview</h3>
          <div className="aspect-[3/4] bg-[var(--brand-cream)] rounded-xl overflow-hidden mb-3">
            {images[0] ? <img src={images[0]} alt="preview" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-zinc-400">No image</div>}
          </div>
          <h4 className="font-medium">{(document.querySelector('input[name="name"]') as HTMLInputElement)?.value || initial?.name || "Product Name"}</h4>
          <p className="text-sm text-zinc-500">{(document.querySelector('input[name="shortDesc"]') as HTMLInputElement)?.value || initial?.shortDesc}</p>
          <p className="text-xs text-[var(--brand-leaf)] mt-2">{variants.length ? `${variants.length} variants` : ""} {tags}</p>
        </div>
      )}
    </div>
  );
}
