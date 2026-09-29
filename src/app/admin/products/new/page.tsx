import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { createProduct } from "@/lib/actions";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProduct() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const cats = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return (
    <AdminShell title="New Product">
      <ProductForm categories={cats} action={createProduct} />
    </AdminShell>
  );
}
