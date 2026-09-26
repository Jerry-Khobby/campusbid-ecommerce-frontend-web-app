"use client"

import type React from "react"
import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { useQuery, type Query } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useNotification } from "@/lib/notification-context"
import { ApiError } from "@/lib/api/client"
import {
  fetchPayment,
  paymentQueryKey,
  useInitializePayment,
  type Payment,
  PAYMENT_POLL_INTERVAL_MS,
  PAYMENT_MAX_POLL_ATTEMPTS,
} from "@/lib/api/payments"

const REDIRECT_DELAY_MS = 2000

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<CallbackShell><Spinner className="mx-auto mb-4 size-10" /></CallbackShell>}>
      <PaymentCallbackPageInner />
    </Suspense>
  )
}

function PaymentCallbackPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentId = searchParams.get("paymentId")

  if (!paymentId) {
    return (
      <CallbackShell>
        <XCircle size={48} className="text-destructive mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Missing payment reference</h1>
        <p className="text-muted-foreground mb-6">We couldn't tell which payment this was for.</p>
        <Button onClick={() => router.push("/orders")} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          Go to Orders
        </Button>
      </CallbackShell>
    )
  }

  return <PaymentStatusPoller paymentId={paymentId} />
}

function PaymentStatusPoller({ paymentId }: { paymentId: string }) {
  const router = useRouter()
  const { addNotification } = useNotification()
  const initializePayment = useInitializePayment()
  const attemptsRef = useRef(0)
  const [attempts, setAttempts] = useState(0)

  const { data: payment, isLoading } = useQuery({
    queryKey: paymentQueryKey(paymentId),
    queryFn: () => fetchPayment(paymentId),
    refetchInterval: (query: Query<Payment, Error>) => {
      if (query.state.data?.status !== "pending") return false
      return attemptsRef.current >= PAYMENT_MAX_POLL_ATTEMPTS ? false : PAYMENT_POLL_INTERVAL_MS
    },
  })

  // Kept in sync with attemptsRef right after each poll so the render below
  // (which decides when to give up) always matches what governs scheduling.
  useEffect(() => {
    if (payment?.status === "pending") {
      attemptsRef.current += 1
      setAttempts(attemptsRef.current)
    }
  }, [payment])

  useEffect(() => {
    if (payment?.status === "held") {
      const timer = setTimeout(() => router.push("/orders"), REDIRECT_DELAY_MS)
      return () => clearTimeout(timer)
    }
  }, [payment?.status, router])

  const handleRetry = async () => {
    if (!payment) return
    try {
      const result = await initializePayment.mutateAsync({ orderId: payment.orderId, paymentMethod: payment.paymentMethod })
      window.location.href = result.authorizationUrl
    } catch (error) {
      addNotification(error instanceof ApiError ? error.message : "Could not restart payment. Please try again.", "error")
    }
  }

  if (isLoading || !payment) {
    return (
      <CallbackShell>
        <Spinner className="mx-auto mb-4 size-10" />
        <h1 className="text-xl font-bold text-foreground mb-2">Confirming your payment...</h1>
        <p className="text-muted-foreground">This will only take a moment.</p>
      </CallbackShell>
    )
  }

  const pollingExhausted = payment.status === "pending" && attempts >= PAYMENT_MAX_POLL_ATTEMPTS

  if (pollingExhausted) {
    return (
      <CallbackShell>
        <AlertTriangle size={48} className="text-accent mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Still processing</h1>
        <p className="text-muted-foreground mb-6">
          Your payment is taking longer than usual to confirm. We'll update your order as soon as it clears.
        </p>
        <Button onClick={() => router.push("/orders")} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          Go to Orders
        </Button>
      </CallbackShell>
    )
  }

  if (payment.status === "pending") {
    return (
      <CallbackShell>
        <Spinner className="mx-auto mb-4 size-10" />
        <h1 className="text-xl font-bold text-foreground mb-2">Confirming your payment...</h1>
        <p className="text-muted-foreground">Please don't close this page.</p>
      </CallbackShell>
    )
  }

  if (payment.status === "held") {
    return (
      <CallbackShell>
        <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Payment successful</h1>
        <p className="text-muted-foreground mb-6">
          Your payment is held securely until the vendor delivers your order. Redirecting you to your orders...
        </p>
        <Button onClick={() => router.push("/orders")} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          Go to Orders Now
        </Button>
      </CallbackShell>
    )
  }

  if (payment.status === "failed") {
    return (
      <CallbackShell>
        <XCircle size={48} className="text-destructive mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Payment failed</h1>
        <p className="text-muted-foreground mb-6">Your payment could not be completed. You can try again.</p>
        <Button
          onClick={handleRetry}
          disabled={initializePayment.isPending}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {initializePayment.isPending ? "Restarting..." : "Try Again"}
        </Button>
      </CallbackShell>
    )
  }

  // released / refunded — the order moved on before we finished polling.
  return (
    <CallbackShell>
      <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
      <h1 className="text-xl font-bold text-foreground mb-2">Payment {payment.status}</h1>
      <p className="text-muted-foreground mb-6">Check your orders for the latest status.</p>
      <Button onClick={() => router.push("/orders")} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
        Go to Orders
      </Button>
    </CallbackShell>
  )
}

function CallbackShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="w-full max-w-md mx-auto px-4 py-16">
      <Card className="p-8 text-center">{children}</Card>
    </main>
  )
}
