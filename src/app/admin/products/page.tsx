import { createAdminClient } from "@/lib/supabase/admin";
import { ProductsClientPage } from "./ProductsClientPage";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const admin = createAdminClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    admin
      .from("products")
      .select(
        "id, name, slug, description, price_kes, stock, is_active, image_url, tint, category_id, sizes, created_at, is_featured"
      )
      .order("created_at", { ascending: false }),
    admin.from("categories").select("id, name, slug").order("id"),
  ]);

  return (
    <ProductsClientPage
      initialProducts={products ?? []}
      categories={categories ?? []}
    />
  );
}
