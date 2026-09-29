import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { updateProduct } from "@/lib/actions";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: true, attributes: true, variants: true, tags: { include: { tag: true } } },
  });
  if (!product) redirect("/admin/products");
  const cats = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const initial = {
    ...product,
    tagsString: product.tags.map((t) => t.tag.name).join(", "),
  };
  const action = updateProduct.bind(null, id);
  return (
    <AdminShell title="Edit Product">
      <ProductForm categories={cats} initial={initial} action={action} />
    </AdminShell>
  );
}
