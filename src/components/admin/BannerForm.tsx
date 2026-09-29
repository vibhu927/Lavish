"use client";
import { useTransition } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";

export function BannerForm({ action }: { action: (fd: FormData) => Promise<void> }) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData);
        toast("Banner created ✓", "success");
      } catch (e: any) {
        toast(e?.message || "Failed to create banner", "error");
      }
    });
  }

  return (
    <form action={handleSubmit} className="bg-white rounded-2xl border border-[var(--brand-muted)] p-6 space-y-3">
      <h3 className="font-medium">New Banner</h3>
      <div><Label>Title</Label><Input name="title" required placeholder="Pure Beauty, Naturally" /></div>
      <div><Label>Subtitle</Label><Input name="subtitle" placeholder="Organic skincare..." /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>CTA Text</Label><Input name="ctaText" placeholder="Explore Collection" /></div>
        <div><Label>CTA Link</Label><Input name="ctaLink" placeholder="/products" /></div>
      </div>
      <div><Label>Desktop Image URL (upload via Media, paste /uploads/...)</Label><Input name="desktopUrl" required placeholder="/uploads/general/banner1.jpg" /></div>
      <div><Label>Mobile Image URL (optional)</Label><Input name="mobileUrl" placeholder="/uploads/general/banner1-mobile.jpg" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Sort Order</Label><Input name="sortOrder" type="number" defaultValue={0} /></div>
        <label className="flex items-center gap-2 text-sm pt-6"><input type="checkbox" name="isActive" defaultChecked /> Active</label>
      </div>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Creating..." : "Create Banner"}</Button>
      <p className="text-xs text-zinc-400">Tip: Upload image in Media then paste URL.</p>
    </form>
  );
}
