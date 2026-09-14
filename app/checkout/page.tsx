"use client"

import CheckoutPage from "@/components/pages/checkout-page"
import { useRequireAuth } from "@/hooks/use-require-auth"

export default function Checkout() {
  const isLoggedIn = useRequireAuth("Please log in to checkout")

  if (!isLoggedIn) {
    return null
  }

  return <CheckoutPage />
}
