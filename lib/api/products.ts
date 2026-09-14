import { apiFetch } from "./client"

// Shape mirrors the backend's Product schema (see
// campus-bid-backend-web-app/docs/products.md). There is no distance/lat/lng
// field on Product — geo data lives on Vendor and is only surfaced through the
// separate GET /products/nearby endpoint, which this app does not use.

export interface ProductRating {
  average: number
  count: number
}

export interface Product {
  _id: string
  vendorId: string
  name: string
  description?: string
  category: string
  images: string[]
  price: number
  discountPrice?: number
  stock: number
  isAvailable: boolean
  preparationTime?: number
  tags: string[]
  rating: ProductRating
  isFlashSale: boolean
  flashSaleId?: string
  views: number
  soldCount: number
  createdAt: string
  updatedAt: string
}

export interface ProductListParams {
  search?: string
  category?: string
  vendorId?: string
  page?: number
  limit?: number
  // Index signature so this can be passed straight through as apiFetch's query object.
  [key: string]: string | number | boolean | undefined
}

export interface ProductListResult {
  items: Product[]
  total: number
  page: number
  limit: number
}

/** Fetches a page of products, optionally filtered by search text, category, or vendor. */
export async function fetchProducts(params: ProductListParams = {}): Promise<ProductListResult> {
  return apiFetch<ProductListResult>("/products", { query: params })
}

/** Fetches a single product by id. */
export async function fetchProduct(id: string): Promise<Product> {
  const json = await apiFetch<{ product: Product }>(`/products/${id}`)
  return json.product
}
