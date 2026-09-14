import ProductDetailPage from "@/components/pages/product-detail-page";

export default async function ProductDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetailPage productId={id} />;
}
