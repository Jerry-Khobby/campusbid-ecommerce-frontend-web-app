// Orders API + React Query hooks. See campus-bid-backend-web-app/docs/orders.md
// for the verified request/response shapes this file mirrors.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "./client"

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "disputed"
  | "completed"
  | "cancelled"
  | "refunded"

// The backend prices each item from its product catalogue, so only the
// product and quantity are sent.
export interface OrderItemInput {
  productId: string
  quantity: number
}

export interface OrderPricing {
  subtotal: number
  deliveryFee: number
  serviceFee: number
  total: number
}

export interface GeoPoint {
  type: "Point"
  coordinates: [number, number]
}

export interface DeliveryAddressInput {
  label?: string
  building?: string
  room?: string
  instructions?: string
  location: GeoPoint
}

export interface CreateOrderInput {
  vendorId: string
  items: OrderItemInput[]
  deliveryAddress: DeliveryAddressInput
  customerNotes?: string
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus
  timestamp: string
  note?: string
}

// customerId/vendorId come back populated as full documents on list/detail
// reads but as plain id strings elsewhere (e.g. right after creation) — the
// exact populated vendor shape isn't pinned down in the docs, so this stays
// loose and callers should go through getOrderVendorName()/getOrderVendorId().
export type OrderRef = string | null | { _id: string; businessName?: string; profile?: { businessName?: string; phoneNumber?: string } }

export interface OrderItemRecord {
  productId: string | null | { _id: string }
  productName: string
  productImage?: string
  quantity: number
  price: number
  isFlashSale: boolean
  flashSaleId?: string
}

// Opened by the customer on a delivered order; the payment stays held until an
// admin refunds it or releases it to the vendor.
export interface OrderDispute {
  reason: string
  openedAt: string
  resolution?: "refund" | "release"
  resolutionNote?: string
  resolvedAt?: string
}

export interface Order {
  _id: string
  orderNumber: string
  customerId: OrderRef
  vendorId: OrderRef
  items: OrderItemRecord[]
  pricing: OrderPricing
  deliveryAddress: DeliveryAddressInput
  status: OrderStatus
  statusHistory: OrderStatusHistoryEntry[]
  paymentId?: string
  deliveryCode?: string
  estimatedDeliveryTime?: string
  actualDeliveryTime?: string
  vendorNotes?: string
  customerNotes?: string
  cancellationReason?: string
  dispute?: OrderDispute
  rating?: { score: number; review?: string; createdAt: string }
  createdAt: string
  updatedAt: string
}

export function getOrderVendorId(order: Order): string {
  if (!order.vendorId) return ""
  return typeof order.vendorId === "string" ? order.vendorId : order.vendorId._id
}

export function getOrderVendorName(order: Order): string {
  if (!order.vendorId || typeof order.vendorId === "string") return "Vendor"
  return order.vendorId.profile?.businessName ?? order.vendorId.businessName ?? "Vendor"
}

interface OrderEnvelope {
  success: boolean
  message: string
  data: Order
}

interface OrderListEnvelope {
  success: boolean
  message: string
  data: Order[]
}

async function createOrder(input: CreateOrderInput): Promise<Order> {
  const json = await apiFetch<OrderEnvelope>("/orders/create", { method: "POST", body: input })
  return json.data
}

async function fetchOrders(): Promise<Order[]> {
  const json = await apiFetch<OrderListEnvelope>("/orders")
  return json.data
}

async function cancelOrder(id: string, cancellationReason: string): Promise<Order> {
  const json = await apiFetch<OrderEnvelope>(`/orders/${id}/cancel`, {
    method: "POST",
    body: { cancellationReason },
  })
  return json.data
}

async function openOrderDispute(id: string, reason: string): Promise<Order> {
  const json = await apiFetch<OrderEnvelope>(`/orders/${id}/dispute`, { method: "POST", body: { reason } })
  return json.data
}

export interface ConfirmDeliveryInput {
  rating?: number
  review?: string
}

async function confirmOrderDelivery(id: string, input: ConfirmDeliveryInput): Promise<Order> {
  const json = await apiFetch<OrderEnvelope>(`/orders/${id}/confirm-delivery`, {
    method: "POST",
    body: input,
  })
  return json.data
}

export const ordersQueryKey = ["orders"] as const

export function useOrders() {
  return useQuery({ queryKey: ordersQueryKey, queryFn: fetchOrders })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ordersQueryKey }),
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, cancellationReason }: { id: string; cancellationReason: string }) =>
      cancelOrder(id, cancellationReason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ordersQueryKey }),
  })
}

export function useOpenDispute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => openOrderDispute(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ordersQueryKey }),
  })
}

export function useConfirmDelivery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & ConfirmDeliveryInput) => confirmOrderDelivery(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ordersQueryKey }),
  })
}
