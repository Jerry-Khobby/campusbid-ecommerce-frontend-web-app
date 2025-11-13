"use client"

import ProductDetailPage from "@/components/pages/product-detail-page"

export default function ProductDetail({ params }: { params: { id: string } }) {
  const { id } = params
  return <ProductDetailPage itemId={Number.parseInt(id)} />
}
