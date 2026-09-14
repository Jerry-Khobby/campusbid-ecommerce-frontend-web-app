// Payments API + React Query hooks. See campus-bid-backend-web-app/docs/payments.md.
// Unlike /orders, PaymentsController.initialize/findOne return the service
// result directly (confirmed by reading payment.controller.ts) — no
// {success, message, data} envelope here.

import { useMutation } from "@tanstack/react-query"
import { apiFetch } from "./client"

export type PaymentMethod = "card" | "mobile_money"
export type PaymentStatus = "pending" | "held" | "released" | "refunded" | "failed"

export interface InitializePaymentResult {
  paymentId: string
  authorizationUrl: string
  accessCode: string
  reference: string
}

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
  createdAt: string
  updatedAt: string
}

export interface InitializePaymentInput {
  orderId: string
  paymentMethod: PaymentMethod
}

export async function initializePayment(input: InitializePaymentInput): Promise<InitializePaymentResult> {
  return apiFetch<InitializePaymentResult>("/payments/initialize", { method: "POST", body: input })
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
