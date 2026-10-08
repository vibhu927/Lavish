import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { updateEnquiryStatus, deleteEnquiry } from "@/lib/actions";
import { ActionForm } from "@/components/admin/ActionForm";

export default async function AdminEnquiries() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const subs = await prisma.contactSubmission.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <AdminShell title="Enquiries">
      <div className="bg-white rounded-2xl border border-[var(--brand-muted)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--brand-cream)] text-left">
              <tr><th className="p-3">Date</th><th className="p-3">Name</th><th className="p-3">Contact</th><th className="p-3">Message</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3 text-xs text-zinc-500">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3"><div className="text-xs">{s.email}</div><div className="text-xs text-zinc-500">{s.phone||"—"}</div><div className="text-xs text-zinc-400">{s.subject||""}</div></td>
                  <td className="p-3 max-w-xs truncate">{s.message}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${s.status==="NEW"?"bg-amber-100 text-amber-700": s.status==="CONTACTED"?"bg-blue-100 text-blue-700":"bg-green-100 text-green-700"}`}>{s.status}</span>
                  </td>
                  <td className="p-3 flex gap-1 flex-wrap">
                    <ActionForm action={updateEnquiryStatus.bind(null, s.id, "CONTACTED")}><button className="text-xs border px-2 py-1 rounded-full hover:bg-zinc-50">Contacted</button></ActionForm>
                    <ActionForm action={updateEnquiryStatus.bind(null, s.id, "RESOLVED")}><button className="text-xs border px-2 py-1 rounded-full hover:bg-zinc-50">Resolved</button></ActionForm>
                    <ActionForm action={deleteEnquiry.bind(null, s.id)}><button className="text-xs text-red-600">Delete</button></ActionForm>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {subs.length===0 && <p className="text-sm text-zinc-500 p-6 text-center">No enquiries yet.</p>}
      </div>
    </AdminShell>
  );
}
