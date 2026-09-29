import { getSettings } from "@/lib/settings";
import { PublicShell } from "@/components/public/PublicShell";

export const revalidate = 60;
export const metadata = { title: "Contact — Leaf Organic" };

export default async function ContactPage() {
  const s = await getSettings();

  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h1 className="font-display text-4xl">{s.siteName} — Get in Touch</h1>
          <p className="text-zinc-500 mt-3">We'd love to hear from you. Enquire about products, availability or collaborations.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl border border-[var(--brand-muted)] p-6">
            <h2 className="font-medium mb-4">Contact Information</h2>
            <div className="space-y-3 text-sm">
              <p><span className="font-medium">Address:</span> {s.address}</p>
              <p><span className="font-medium">Phone:</span> {s.phone}</p>
              <p><span className="font-medium">Email:</span> {s.email}</p>
              <p><span className="font-medium">Hours:</span> {s.businessHours}</p>
              {s.gstNumber && <p><span className="font-medium">GST:</span> {s.gstNumber}</p>}
            </div>
            {s.mapEmbedUrl && (
              <div className="mt-6 rounded-2xl overflow-hidden border border-[var(--brand-muted)]">
                <iframe src={s.mapEmbedUrl} width="100%" height="220" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            )}
            {s.whatsappEnabled && s.whatsappNumber && (
              <a href={`https://wa.me/${s.whatsappNumber.replace(/[^0-9]/g,"")}?text=${encodeURIComponent(s.whatsappDefaultMsg||"Hi")}`} target="_blank" className="mt-4 inline-flex bg-[#25D366] text-white rounded-full px-6 py-2 text-sm font-medium">Chat on WhatsApp</a>
            )}
          </div>

          <ContactForm />
        </div>
      </div>
    </PublicShell>
  );
}

function ContactForm() {
  return (
    <form id="contactForm" className="bg-white rounded-3xl border border-[var(--brand-muted)] p-6 space-y-4">
      <h2 className="font-medium">Send a Message</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label className="text-sm font-medium">Name*</label><input name="name" required className="mt-1 w-full h-10 rounded-xl border border-[var(--brand-muted)] px-3 text-sm" placeholder="Your name" /></div>
        <div><label className="text-sm font-medium">Email*</label><input name="email" type="email" required className="mt-1 w-full h-10 rounded-xl border border-[var(--brand-muted)] px-3 text-sm" placeholder="you@example.com" /></div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label className="text-sm font-medium">Phone</label><input name="phone" className="mt-1 w-full h-10 rounded-xl border border-[var(--brand-muted)] px-3 text-sm" placeholder="+91 ..." /></div>
        <div><label className="text-sm font-medium">Subject</label><input name="subject" className="mt-1 w-full h-10 rounded-xl border border-[var(--brand-muted)] px-3 text-sm" placeholder="Enquiry about..." /></div>
      </div>
      <div><label className="text-sm font-medium">Message*</label><textarea name="message" required rows={4} className="mt-1 w-full rounded-xl border border-[var(--brand-muted)] px-3 py-2 text-sm" placeholder="How can we help?" /></div>
      {/* honeypot */}
      <input type="text" name="website" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
      <button type="submit" className="w-full bg-[var(--brand-charcoal)] text-white rounded-full h-11 font-medium hover:bg-[var(--brand-teal)] transition">Send Message</button>
      <p id="formStatus" className="text-sm text-center"></p>
      <script dangerouslySetInnerHTML={{__html: `
        document.getElementById('contactForm')?.addEventListener('submit', async (e)=>{
          e.preventDefault();
          const fd=new FormData(e.target);
          if(fd.get('website')) return;
          const status=document.getElementById('formStatus');
          const btn=e.target.querySelector('button[type="submit"]');
          const orig=btn.textContent; btn.textContent='Sending...'; btn.disabled=true;
          status.textContent=''; 
          const body={ name: fd.get('name'), email: fd.get('email'), phone: fd.get('phone'), subject: fd.get('subject'), message: fd.get('message') };
          try{
            const r=await fetch('/api/contact',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
            const d=await r.json();
            if(r.ok){ 
              status.textContent='Message sent!'; status.className='text-sm text-center text-green-600'; 
              window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Message sent ✓ We will contact you soon.', type: 'success' }}));
              e.target.reset(); 
            } else { 
              status.textContent=d.error||'Failed to send'; status.className='text-sm text-center text-red-600'; 
              window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: d.error||'Failed to send', type: 'error' }}));
            }
          } catch(err){
            window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Network error', type: 'error' }}));
          } finally { btn.textContent=orig; btn.disabled=false; }
        });
      `}} />
    </form>
  );
}
