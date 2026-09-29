import { AdminNav } from "./AdminNav";
export function AdminShell({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="min-h-screen bg-[var(--brand-cream)] flex">
      <aside className="w-64 bg-[#F6F4EF] border-r border-[var(--brand-muted)] p-6 hidden md:block sticky top-0 h-screen overflow-auto">
        <div className="flex items-center gap-2 mb-8">
          <img src="/logo.jpg" alt="Leaf" className="h-8 w-8 rounded-full" />
          <span className="font-display text-lg">Leaf Admin</span>
        </div>
        <AdminNav />
      </aside>
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        {title && <h1 className="font-display text-3xl mb-6">{title}</h1>}
        {children}
        <div className="md:hidden mt-8 border-t pt-6">
          <AdminNav />
        </div>
      </main>
    </div>
  );
}
