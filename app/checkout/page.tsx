"use client"

import CheckoutPage from "@/components/pages/checkout-page"
import { useUser } from "@/lib/user-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useNotification } from "@/lib/notification-context"

export default function Checkout() {
  const { isLoggedIn } = useUser()
  const router = useRouter()
  const { addNotification } = useNotification()

  useEffect(() => {
    if (!isLoggedIn) {
      addNotification("Please log in to checkout", "info")
      router.push("/login")
    }
  }, [isLoggedIn, router, addNotification])

  if (!isLoggedIn) {
    return null
  }

  return <CheckoutPage />
}
