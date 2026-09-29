"use client";
import { useState, useTransition } from "react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";

export function CategoryForm({ categories, initial, action }: { categories: any[]; initial?: any; action: (fd: FormData) => Promise<void> }) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState(initial?.image || "");
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "categories");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (data.url) setImageUrl(data.url);
    else alert(data.error || "Upload failed");
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData);
        toast(initial ? "Category updated ✓" : "Category created ✓", "success");
      } catch (e: any) {
        toast(e?.message || "Failed to save category", "error");
      }
    });
  }

  return (
    <form action={handleSubmit} className="bg-white rounded-2xl border border-[var(--brand-muted)] p-6 space-y-4 max-w-2xl">
      <div>
        <Label>Name</Label>
        <Input name="name" defaultValue={initial?.name} required placeholder="Skincare" />
      </div>
      <div>
        <Label>Slug (auto if empty)</Label>
        <Input name="slug" defaultValue={initial?.slug} placeholder="skincare" />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea name="description" defaultValue={initial?.description || ""} placeholder="Category description" />
      </div>
      <div>
        <Label>Parent Category (optional — for subcategories)</Label>
        <select name="parentId" defaultValue={initial?.parentId || ""} className="w-full h-10 rounded-xl border border-[var(--brand-muted)] bg-white px-3 text-sm">
          <option value="">No parent (top-level)</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <Label>Category Image</Label>
        <div className="flex gap-3 items-center">
          <input type="file" accept="image/*" onChange={handleUpload} className="text-sm" />
          {uploading && <span className="text-sm text-zinc-500">Uploading...</span>}
        </div>
        {imageUrl && <img src={imageUrl} alt="preview" className="h-24 w-24 object-cover rounded-xl mt-2 border" />}
        <Input type="hidden" name="image" value={imageUrl} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Sort Order</Label>
          <Input name="sortOrder" type="number" defaultValue={initial?.sortOrder ?? 0} />
        </div>
        <div className="flex flex-col gap-2 pt-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isTopRated" defaultChecked={initial?.isTopRated} /> Mark as Top Rated
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? true} /> Active
          </label>
        </div>
      </div>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving..." : initial ? "Update Category" : "Create Category"}</Button>
    </form>
  );
}
