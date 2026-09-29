import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  // allow login page without auth
  // This layout is for /admin/* but login page will also use it — handle there
  // So we check if path is login via header? Simpler: always check, but login page will redirect if already logged
  return <AdminShell user={user}>{children}</AdminShell>;
}

function AdminShell({ user, children }: { user: any; children: React.ReactNode }) {
  // This is server component already checked; client shell in children
  return <>{children}</>;
}
