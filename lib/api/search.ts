import { apiFetch } from "./client"
import type { Product } from "./products"

// Raw vendor fields the backend's text search returns (see
// campus-bid-backend-web-app/src/modules/vendors/schema/vendor.schema.ts).
// Kept local like product-detail-page.tsx's PublicVendor since this app has
// no shared lib/api/vendors.ts yet.
export interface VendorSearchResult {
  _id: string
  profile: { businessName: string; logo?: string; description?: string }
  categories: string[]
  rating: { average: number; count: number }
}

export interface SearchResult {
  products: Product[]
  vendors: VendorSearchResult[]
  totalResults: number
}

/** Full-text search across products and vendors via GET /search. `q` must be non-empty. */
export async function search(q: string, category?: string): Promise<SearchResult> {
  const json = await apiFetch<{ data: SearchResult }>("/search", {
    query: { q, type: "all", category },
  })
  return json.data
}
