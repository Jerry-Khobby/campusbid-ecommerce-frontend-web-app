import { ApiError, apiFetch } from "./client"

const CONFLICT = 409

export type FlashSaleStatus = "upcoming" | "active" | "completed" | "cancelled"
export type FlashSaleReason = "closing_time" | "expiring_stock"
export type BidStatus = "active" | "won" | "lost"

export interface FlashSaleVendor {
  _id: string
  profile: {
    businessName?: string
  }
}

export interface FlashSaleProduct {
  _id: string
  name: string
  images: string[]
  category?: string
}

export interface FlashSaleBidder {
  _id: string
  email: string
  profile?: {
    firstName?: string
    lastName?: string
  }
}

export interface FlashSaleBidEntry {
  userId: string
  amount: number
  timestamp: string
}

export interface FlashSale {
  _id: string
  vendorId: FlashSaleVendor
  productId: FlashSaleProduct
  originalPrice: number
  startingBid: number
  currentBid?: number
  currentBidder?: FlashSaleBidder
  minimumBidIncrement: number
  quantity: number
  startTime: string
  endTime: string
  status: FlashSaleStatus
  bids: FlashSaleBidEntry[]
  winner?: FlashSaleBidder
  reason?: FlashSaleReason
  createdAt: string
  updatedAt: string
}

export interface FlashSaleWithBidStatus extends FlashSale {
  bidStatus: BidStatus
}

/** The lowest amount `placeBid` will currently accept for this sale. */
// A 409 means another bid landed (or the sale closed) between loading the
// sale and bidding, so the price the bidder saw is no longer current.
export function isStaleBidError(error: unknown): boolean {
  return error instanceof ApiError && error.status === CONFLICT
}

export function getMinimumBidAmount(flashSale: FlashSale): number {
  return Math.max(flashSale.currentBid ?? 0, flashSale.startingBid) + flashSale.minimumBidIncrement
}

export const activeFlashSalesQueryKey = ["flash-sales", "active"] as const

export const flashSaleQueryKey = (id: string) => ["flash-sales", id] as const

export const myBidsQueryKey = (status?: BidStatus) => ["flash-sales", "my-bids", status] as const

export async function fetchActiveFlashSales(): Promise<FlashSale[]> {
  const json = await apiFetch<{ data: FlashSale[] }>("/flash-sales", { query: { status: "active" } })
  return json.data
}

export async function fetchFlashSale(id: string): Promise<FlashSale> {
  const json = await apiFetch<{ data: FlashSale }>(`/flash-sales/${id}`)
  return json.data
}

export async function placeBid(id: string, amount: number): Promise<FlashSale> {
  const json = await apiFetch<{ data: FlashSale }>(`/flash-sales/${id}/bid`, {
    method: "POST",
    body: { amount },
  })
  return json.data
}

export async function fetchMyBids(status?: BidStatus): Promise<FlashSaleWithBidStatus[]> {
  const json = await apiFetch<{ data: FlashSaleWithBidStatus[] }>("/flash-sales/my-bids", {
    query: { status },
  })
  return json.data
}
