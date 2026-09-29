"use client";
import { useTransition } from "react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";

export function BlogForm({ action }: { action: (fd: FormData) => Promise<void> }) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData);
        toast("Blog post created ✓", "success");
      } catch (e: any) {
        toast(e?.message || "Failed to create post", "error");
      }
    });
  }

  return (
    <form action={handleSubmit} className="bg-white rounded-2xl border border-[var(--brand-muted)] p-6 space-y-3">
      <h3 className="font-medium">New Post</h3>
      <div><Label>Title</Label><Input name="title" required /></div>
      <div><Label>Slug (auto)</Label><Input name="slug" placeholder="auto" /></div>
      <div><Label>Excerpt</Label><Input name="excerpt" maxLength={300} /></div>
      <div><Label>Cover Image URL</Label><Input name="coverImage" placeholder="/uploads/general/blog1.jpg" /></div>
      <div><Label>Content</Label><Textarea name="content" rows={6} placeholder="Blog content..." /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>SEO Title</Label><Input name="seoTitle" maxLength={70} /></div>
        <div><Label>SEO Desc</Label><Input name="seoDesc" maxLength={160} /></div>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isPublished" /> Published</label>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Creating..." : "Create Post"}</Button>
    </form>
  );
}
