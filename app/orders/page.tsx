"use client"

import OrdersPage from "@/components/pages/orders-page"
import { useRequireAuth } from "@/hooks/use-require-auth"

export default function Orders() {
  const isLoggedIn = useRequireAuth("Please log in to view your orders")

  if (!isLoggedIn) {
    return null
  }

  return <OrdersPage />
}
