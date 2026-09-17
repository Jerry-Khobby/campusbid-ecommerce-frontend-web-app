// Reviews API + React Query hook. See campus-bid-backend-web-app/docs/reviews.md.

import { useMutation, useQuery } from "@tanstack/react-query"
import { apiFetch } from "./client"

export interface VendorReview {
  _id: string
  rating: number
  review?: string
  customerId: { _id: string; profile?: { firstName?: string; lastName?: string } } | null
  createdAt: string
}

interface VendorReviewsResponse {
  items: VendorReview[]
  total: number
  page: number
  limit: number
}

export function vendorReviewsQueryKey(vendorId: string) {
  return ["reviews", "vendor", vendorId] as const
}

export async function fetchVendorReviews(vendorId: string): Promise<VendorReviewsResponse> {
  const json = await apiFetch<{ data: VendorReviewsResponse }>(`/reviews/vendor/${vendorId}`, {
    query: { limit: 20 },
  })
  return json.data
}

export function useVendorReviews(vendorId: string | undefined) {
  return useQuery({
    queryKey: vendorReviewsQueryKey(vendorId ?? ""),
    queryFn: () => fetchVendorReviews(vendorId as string),
    enabled: Boolean(vendorId),
  })
}

export interface ProductRatingInput {
  productId: string
  rating: number
}

export interface CreateReviewInput {
  orderId: string
  vendorId: string
  rating: number
  review?: string
  productRatings: ProductRatingInput[]
}

export interface CreateReviewResult {
  orderId: string
  reviewsCreated: number
}

interface CreateReviewEnvelope {
  success: boolean
  message: string
  data: CreateReviewResult
}

async function createReview(input: CreateReviewInput): Promise<CreateReviewResult> {
  const json = await apiFetch<CreateReviewEnvelope>("/reviews", { method: "POST", body: input })
  return json.data
}

export function useCreateReview() {
  return useMutation({ mutationFn: createReview })
}
