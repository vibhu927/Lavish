"use client";
import { useTransition } from "react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";

export function SettingsForm({ settings, action }: { settings: any; action: (fd: FormData) => Promise<void> }) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData);
        toast("Settings saved ✓", "success");
      } catch (e: any) {
        toast(e?.message || "Failed to save settings", "error");
      }
    });
  }

  return (
    <form action={handleSubmit} className="bg-white rounded-2xl border border-[var(--brand-muted)] p-6 space-y-6 max-w-3xl">
      <div className="grid md:grid-cols-2 gap-4">
        <div><Label>Site Name</Label><Input name="siteName" defaultValue={settings.siteName} /></div>
        <div><Label>Logo URL</Label><Input name="logoUrl" defaultValue={settings.logoUrl||""} placeholder="/logo.jpg" /></div>
      </div>

      <h3 className="font-medium border-t pt-4">Header</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div><Label>Announcement Bar</Label><Input name="headerAnnouncement" defaultValue={settings.headerAnnouncement||""} /></div>
        <div><Label>Quote</Label><Input name="headerQuote" defaultValue={settings.headerQuote||""} /></div>
      </div>

      <h3 className="font-medium border-t pt-4">Footer</h3>
      <div><Label>Footer Headline</Label><Input name="footerHeadline" defaultValue={settings.footerHeadline||""} /></div>
      <div><Label>Footer Description</Label><Textarea name="footerDesc" defaultValue={settings.footerDesc||""} /></div>
      <div className="grid md:grid-cols-2 gap-4">
        <div><Label>Address</Label><Input name="address" defaultValue={settings.address||""} /></div>
        <div><Label>GST Number</Label><Input name="gstNumber" defaultValue={settings.gstNumber||""} /></div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div><Label>Phone</Label><Input name="phone" defaultValue={settings.phone||""} /></div>
        <div><Label>Email</Label><Input name="email" defaultValue={settings.email||""} /></div>
        <div><Label>Business Hours</Label><Input name="businessHours" defaultValue={settings.businessHours||""} /></div>
      </div>
      <div><Label>Copyright</Label><Input name="copyrightText" defaultValue={settings.copyrightText||""} /></div>

      <h3 className="font-medium border-t pt-4">Contact Page</h3>
      <div><Label>Map Embed URL (iframe src)</Label><Input name="mapEmbedUrl" defaultValue={settings.mapEmbedUrl||""} placeholder="https://www.google.com/maps/embed?..." /></div>

      <h3 className="font-medium border-t pt-4">WhatsApp</h3>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="whatsappEnabled" defaultChecked={settings.whatsappEnabled} /> Enabled</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="blogEnabled" defaultChecked={settings.blogEnabled} /> Blogs Enabled</label>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div><Label>WhatsApp Number (with country code, no +)</Label><Input name="whatsappNumber" defaultValue={settings.whatsappNumber||""} placeholder="919876543210" /></div>
        <div><Label>Default Message</Label><Input name="whatsappDefaultMsg" defaultValue={settings.whatsappDefaultMsg||""} /></div>
      </div>
      <div><Label>Product Template (use {"{productName}"}, {"{weight}"}, {"{productUrl}"})</Label><Input name="whatsappProductTemplate" defaultValue={settings.whatsappProductTemplate||""} /></div>

      <h3 className="font-medium border-t pt-4">Social</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div><Label>Instagram</Label><Input name="instagramUrl" defaultValue={settings.instagramUrl||""} /></div>
        <div><Label>Facebook</Label><Input name="facebookUrl" defaultValue={settings.facebookUrl||""} /></div>
        <div><Label>YouTube</Label><Input name="youtubeUrl" defaultValue={settings.youtubeUrl||""} /></div>
        <div><Label>LinkedIn</Label><Input name="linkedinUrl" defaultValue={settings.linkedinUrl||""} /></div>
      </div>

      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving..." : "Save Settings"}</Button>
      <p className="text-xs text-zinc-400 text-center">Changes reflect immediately on public site (ISR revalidated).</p>
    </form>
  );
}
