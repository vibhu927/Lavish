"use client";
import { whatsappLink, buildProductWhatsappMessage } from "@/lib/utils";

export function WhatsAppButton({ number, template, product }: { number: string; template: string; product: { name: string; weight?: string | null; slug: string } }) {
  if (!number) return null;
  const msg = buildProductWhatsappMessage(template, product);
  const href = whatsappLink(number, msg);
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full h-11 px-6 font-medium transition">
      <span>Enquire on WhatsApp</span>
    </a>
  );
}
