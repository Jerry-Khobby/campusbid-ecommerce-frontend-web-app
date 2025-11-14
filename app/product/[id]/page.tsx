import ProductDetailPage from "@/components/pages/product-detail-page";

export default async function ProductDetail({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  return <ProductDetailPage itemId={Number.parseInt(id)} />;
}
