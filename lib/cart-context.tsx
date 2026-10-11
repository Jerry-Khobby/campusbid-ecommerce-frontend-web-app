"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

export interface CartItem {
  id: string
  vendorId: string
  name: string
  vendor: string
  price: number
  image: string
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (id: string) => void
  /** Puts a removed item back where it was — backs the "Undo" on removal. */
  restoreItem: (item: CartItem, index: number) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  /** Drops one vendor's items after that vendor's order is paid, keeping the rest. */
  clearVendorItems: (vendorId: string) => void
  total: number
  /** Sum of quantities, not distinct lines — what "N items" should count. */
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

// Cart has no backend counterpart (confirmed: no /cart endpoints exist), so
// it's local-only state. Persisted to localStorage so it survives a reload,
// same as savedItemIds in user-context.tsx.
const CART_STORAGE_KEY = "campusbid.cartItems"

function readCartItems(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    setItems(readCartItems())
  }, [])

  const persist = (next: CartItem[]): CartItem[] => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next))
    return next
  }

  const addItem = (item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      const next = existing
        ? prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...prev, { ...item, quantity: 1 }]
      return persist(next)
    })
  }

  const removeItem = (id: string) => {
    setItems((prev) => persist(prev.filter((i) => i.id !== id)))
  }

  const restoreItem = (item: CartItem, index: number) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev
      const next = [...prev]
      next.splice(Math.min(index, next.length), 0, item)
      return persist(next)
    })
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
    } else {
      setItems((prev) => persist(prev.map((i) => (i.id === id ? { ...i, quantity } : i))))
    }
  }

  const clearCart = () => {
    setItems(persist([]))
  }

  const clearVendorItems = (vendorId: string) => {
    setItems((prev) => persist(prev.filter((i) => i.vendorId !== vendorId)))
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, restoreItem, updateQuantity, clearCart, clearVendorItems, total, itemCount }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within CartProvider")
  }
  return context
}
