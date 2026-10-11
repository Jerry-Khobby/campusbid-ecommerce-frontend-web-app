"use client"

import CheckoutPage from "@/components/pages/checkout-page"
import { Suspense } from "react"
import { useRequireAuth } from "@/hooks/use-require-auth"

export default function Checkout() {
  const isLoggedIn = useRequireAuth("Please log in to checkout")

  if (!isLoggedIn) {
    return null
  }

  // The page reads its query string (useSearchParams), which needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <CheckoutPage />
    </Suspense>
  )
}
