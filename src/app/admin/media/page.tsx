import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminMedia() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const assets = await prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <AdminShell title="Media Library">
      <div className="bg-white rounded-2xl border border-[var(--brand-muted)] p-6 mb-6">
        <h3 className="font-medium mb-3">Upload</h3>
        <form id="uploadForm" className="flex gap-3">
          <input type="file" id="fileInput" accept="image/*" className="text-sm" />
          <select id="folder" className="border rounded-xl px-3 text-sm">
            <option value="general">general</option>
            <option value="products">products</option>
            <option value="categories">categories</option>
            <option value="banners">banners</option>
          </select>
          <button type="submit" className="bg-[var(--brand-charcoal)] text-white rounded-full px-5 py-2 text-sm">Upload</button>
        </form>
        <p id="uploadStatus" className="text-sm mt-2"></p>
        <script dangerouslySetInnerHTML={{__html:`
          document.getElementById('uploadForm')?.addEventListener('submit', async (e)=>{
            e.preventDefault();
            const f=document.getElementById('fileInput').files[0];
            const folder=document.getElementById('folder').value;
            const status=document.getElementById('uploadStatus');
            if(!f){ status.textContent='Select file'; window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Select a file', type: 'error' }})); return; }
            const fd=new FormData(); fd.append('file',f); fd.append('folder',folder);
            status.textContent='Uploading...';
            const r=await fetch('/api/upload',{method:'POST',body:fd});
            const d=await r.json();
            if(d.url){ status.textContent='Uploaded: '+d.url; window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Uploaded ✓ '+d.url, type: 'success' }})); } else { status.textContent=d.error||'Failed'; window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: d.error||'Upload failed', type: 'error' }})); }
            if(d.url) setTimeout(()=>location.reload(),800);
          });
        `}} />
        <p className="text-xs text-zinc-400 mt-2">Stored at <code>public/uploads/*</code> (local FS). Max 4.5MB, jpg/png/webp/avif. Dedup by hash.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {assets.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl border border-[var(--brand-muted)] overflow-hidden">
            <img src={a.url} alt={a.filename} className="aspect-square object-cover w-full" />
            <div className="p-2">
              <p className="text-xs truncate">{a.filename}</p>
              <p className="text-[10px] text-zinc-500 truncate">{a.url}</p>
              <p className="text-[10px] text-zinc-400">{(a.size/1024).toFixed(1)}KB</p>
            </div>
          </div>
        ))}
      </div>
      {assets.length===0 && <p className="text-sm text-zinc-500 text-center mt-6">No media yet. Upload above.</p>}
    </AdminShell>
  );
}
