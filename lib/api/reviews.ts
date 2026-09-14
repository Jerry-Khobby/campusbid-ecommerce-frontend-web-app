// Reviews API + React Query hook. See campus-bid-backend-web-app/docs/reviews.md.

import { useMutation } from "@tanstack/react-query"
import { apiFetch } from "./client"

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
