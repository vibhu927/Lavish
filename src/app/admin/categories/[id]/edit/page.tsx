import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { updateCategory } from "@/lib/actions";
import { CategoryForm } from "@/components/admin/CategoryForm";

export default async function EditCategory({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) redirect("/admin/categories");
  const cats = await prisma.category.findMany({ where: { parentId: null, id: { not: id } }, orderBy: { name: "asc" } });
  const action = updateCategory.bind(null, id);
  return (
    <AdminShell title="Edit Category">
      <CategoryForm categories={cats} initial={cat} action={action} />
    </AdminShell>
  );
}
