import { getSettings } from "@/lib/settings";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { updateSettings } from "@/lib/actions";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function AdminSettings() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const s = await getSettings();

  return (
    <AdminShell title="Website Settings">
      <SettingsForm settings={s} action={updateSettings} />
    </AdminShell>
  );
}
