import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { createCategory } from "@/lib/actions";
import { CategoryForm } from "@/components/admin/CategoryForm";

export default async function NewCategory() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const cats = await prisma.category.findMany({ where: { parentId: null }, orderBy: { name: "asc" } });
  return (
    <AdminShell title="New Category">
      <CategoryForm categories={cats} action={createCategory} />
    </AdminShell>
  );
}
