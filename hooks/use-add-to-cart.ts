"use client"

import { useCart } from "@/lib/cart-context"
import { useNotification } from "@/lib/notification-context"
import type { Product } from "@/lib/api/products"

/**
 * Adds a product to the cart and tells the customer what happened. Orders are
 * placed one vendor at a time, so adding from a second vendor says so up front
 * instead of leaving them to discover it at checkout.
 */
export function useAddToCart() {
  const { items, addItem } = useCart()
  const { addNotification } = useNotification()

  return (product: Product, vendorName?: string) => {
    if (!product.isAvailable) {
      addNotification(`${product.name} is currently unavailable`, "warning")
      return
    }

    const isNewVendor = items.length > 0 && !items.some((item) => item.vendorId === product.vendorId)

    addItem({
      id: product._id,
      vendorId: product.vendorId,
      name: product.name,
      vendor: vendorName ?? product.vendorName ?? "Vendor",
      price: product.discountPrice ?? product.price,
      image: product.images[0] ?? "/placeholder.svg",
    })

    if (isNewVendor) {
      addNotification(
        `${product.name} added. It's from a different vendor, so it will be a separate order at checkout.`,
        "info",
        5000,
      )
    } else {
      addNotification(`${product.name} added to cart`, "success")
    }
  }
}
