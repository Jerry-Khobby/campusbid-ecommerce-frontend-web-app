// Payments API + React Query hooks. See campus-bid-backend-web-app/docs/payments.md.
// Unlike /orders, PaymentsController.initialize/findOne return the service
// result directly (confirmed by reading payment.controller.ts) — no
// {success, message, data} envelope here.

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "./client"
import { ordersQueryKey } from "./orders"

export type PaymentMethod = "card" | "mobile_money"
export type PaymentStatus = "pending" | "held" | "released" | "refunded" | "failed"

// Paystack's Mobile Money provider codes for Ghana. Airtel and Tigo merged
// into one network (AirtelTigo) in 2017 — Paystack has no separate codes for
// them.
export type MomoProvider = "mtn" | "vod" | "atl"

export const MOMO_PROVIDER_OPTIONS: { value: MomoProvider; label: string }[] = [
  { value: "mtn", label: "MTN Mobile Money" },
  { value: "vod", label: "Telecel Cash" },
  { value: "atl", label: "AirtelTigo Money" },
]

export interface CardPaymentResult {
  paymentId: string
  paymentMethod: "card"
  authorizationUrl: string
  accessCode: string
  reference: string
}

export interface MobileMoneyPaymentResult {
  paymentId: string
  paymentMethod: "mobile_money"
  reference: string
  status: string
  displayText?: string
}

export type InitializePaymentResult = CardPaymentResult | MobileMoneyPaymentResult

export interface Payment {
  _id: string
  orderId: string
  customerId: string
  vendorId: string
  amount: number
  currency: string
  paymentMethod: PaymentMethod
  status: PaymentStatus
  transactionId: string
  payoutId?: string
  adminCommission: number
  vendorPayout: number
  gatewayReference?: string
  holdStartTime?: string
  releaseTime?: string
  refundTime?: string
  metadata?: { momoProvider?: MomoProvider; phone?: string }
  createdAt: string
  updatedAt: string
}

export interface InitializePaymentInput {
  orderId: string
  paymentMethod: PaymentMethod
  momoProvider?: MomoProvider
  phone?: string
}

export async function initializePayment(input: InitializePaymentInput): Promise<InitializePaymentResult> {
  return apiFetch<InitializePaymentResult>("/payments/initialize", { method: "POST", body: input })
}

export async function submitMomoOtp(paymentId: string, otp: string): Promise<{ status: string }> {
  return apiFetch<{ status: string }>(`/payments/${paymentId}/submit-otp`, { method: "POST", body: { otp } })
}

export function useSubmitMomoOtp() {
  return useMutation({
    mutationFn: ({ paymentId, otp }: { paymentId: string; otp: string }) => submitMomoOtp(paymentId, otp),
  })
}

export async function fetchPayment(id: string): Promise<Payment> {
  return apiFetch<Payment>(`/payments/${id}`)
}

export function paymentQueryKey(id: string) {
  return ["payment", id] as const
}

export function useInitializePayment() {
  return useMutation({ mutationFn: initializePayment })
}

export const PAYMENT_POLL_INTERVAL_MS = 2000
export const PAYMENT_MAX_POLL_ATTEMPTS = 30

export interface RefundPaymentInput {
  paymentId: string
  reason: string
  amount?: number
}

async function refundPayment({ paymentId, reason, amount }: RefundPaymentInput): Promise<Payment> {
  return apiFetch<Payment>(`/payments/${paymentId}/refund`, {
    method: "PUT",
    body: amount !== undefined ? { reason, amount } : { reason },
  })
}

export function useRefundPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: refundPayment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ordersQueryKey }),
  })
}
