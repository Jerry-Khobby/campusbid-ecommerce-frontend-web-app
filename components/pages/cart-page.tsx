"use client"

import { Trash2, Plus, Minus, ShoppingBag, Store } from "lucide-react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCart, type CartItem } from "@/lib/cart-context"
import { useNotification } from "@/lib/notification-context"
import { useRouter } from "next/navigation"
import { DELIVERY_FEE, SERVICE_FEE } from "@/lib/constants"
import { OptimizedImage } from "@/components/optimized-image"
import { formatCurrency, pluralize } from "@/lib/format"

interface VendorGroup {
  vendorId: string
  vendorName: string
  items: CartItem[]
  subtotal: number
}

// Orders are placed one vendor at a time, so the cart is laid out the same
// way: one group, subtotal and checkout button per vendor.
function groupByVendor(items: CartItem[]): VendorGroup[] {
  const groups = new Map<string, VendorGroup>()
  for (const item of items) {
    const group = groups.get(item.vendorId) ?? {
      vendorId: item.vendorId,
      vendorName: item.vendor,
      items: [],
      subtotal: 0,
    }
    group.items.push(item)
    group.subtotal += item.price * item.quantity
    groups.set(item.vendorId, group)
  }
  return [...groups.values()]
}

export default function CartPage() {
  const router = useRouter()
  const { items, removeItem, restoreItem, updateQuantity, itemCount } = useCart()
  const { addNotification } = useNotification()

  const handleRemove = (item: CartItem) => {
    const index = items.findIndex((i) => i.id === item.id)
    removeItem(item.id)
    addNotification(`${item.name} removed from cart`, "info", 6000, {
      label: "Undo",
      onClick: () => restoreItem(item, index),
    })
  }

  if (items.length === 0) {
    return (
      <main className="w-full max-w-2xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Shopping Cart</h1>
        </div>

        <div className="flex flex-col items-center justify-center py-16">
          <ShoppingBag size={48} className="text-muted-foreground mb-4" aria-hidden="true" />
          <p className="text-muted-foreground text-center">Your cart is empty</p>
          <p className="text-sm text-muted-foreground text-center mt-2 mb-6">
            Browse campus vendors and add something you like.
          </p>
          <Link
            href="/home"
            className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-2 font-semibold text-accent-foreground hover:bg-accent/90"
          >
            Start shopping
          </Link>
        </div>
      </main>
    )
  }

  const vendorGroups = groupByVendor(items)
  const hasMultipleVendors = vendorGroups.length > 1

  return (
    <main className="w-full max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Shopping Cart</h1>
        <p className="text-muted-foreground">
          {pluralize(itemCount, "item")}
          {hasMultipleVendors && ` from ${pluralize(vendorGroups.length, "vendor")}`}
        </p>
      </div>

      {hasMultipleVendors && (
        <Card className="p-4 mb-6 bg-muted/50 text-sm text-foreground">
          Each vendor is a separate order with its own delivery fee. Check out one vendor at a time; the rest stay in
          your cart.
        </Card>
      )}

      <div className="space-y-8">
        {vendorGroups.map((group) => (
          <section key={group.vendorId} aria-label={`Items from ${group.vendorName}`}>
            <h2 className="flex items-center gap-2 font-semibold text-foreground mb-3">
              <Store size={18} className="text-muted-foreground" aria-hidden="true" />
              {group.vendorName}
            </h2>

            <div className="space-y-3 mb-4">
              {group.items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onDecrease={() => updateQuantity(item.id, item.quantity - 1)}
                  onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
                  onRemove={() => handleRemove(item)}
                />
              ))}
            </div>

            <Card className="p-6 bg-card">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(group.subtotal)}</span>
                </div>
                <div className="flex justify-between text-foreground">
                  <span>Delivery Fee</span>
                  <span>{formatCurrency(DELIVERY_FEE)}</span>
                </div>
                {SERVICE_FEE > 0 && (
                  <div className="flex justify-between text-foreground">
                    <span>Service Fee</span>
                    <span>{formatCurrency(SERVICE_FEE)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-3 flex justify-between font-bold text-lg text-foreground">
                  <span>Total</span>
                  <span className="text-accent">{formatCurrency(group.subtotal + DELIVERY_FEE + SERVICE_FEE)}</span>
                </div>
              </div>

              <Button
                onClick={() => router.push(`/checkout?vendor=${encodeURIComponent(group.vendorId)}`)}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-6"
              >
                {hasMultipleVendors ? `Checkout ${group.vendorName}` : "Proceed to Checkout"}
              </Button>
            </Card>
          </section>
        ))}
      </div>
    </main>
  )
}

function CartItemRow({
  item,
  onDecrease,
  onIncrease,
  onRemove,
}: {
  item: CartItem
  onDecrease: () => void
  onIncrease: () => void
  onRemove: () => void
}) {
  return (
    <Card className="p-4 flex-row gap-4">
      <div className="w-20 h-20 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
        <OptimizedImage src={item.image} alt="" className="w-full h-full" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <h3 className="font-semibold text-foreground">{item.name}</h3>
        <p className="font-bold text-accent">{formatCurrency(item.price)}</p>
      </div>

      <div className="flex flex-col items-center justify-between">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {/* Stops at 1: removing is the bin's job, so repeated taps can't
              silently delete this row and then the one that slides up. */}
          <button
            onClick={onDecrease}
            disabled={item.quantity <= 1}
            aria-label={`Decrease quantity of ${item.name}`}
            className="p-2 hover:bg-background rounded transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Minus size={16} className="text-foreground" aria-hidden="true" />
          </button>
          <span className="w-8 text-center font-semibold text-foreground" aria-live="polite">
            <span className="sr-only">Quantity </span>
            {item.quantity}
          </span>
          <button
            onClick={onIncrease}
            aria-label={`Increase quantity of ${item.name}`}
            className="p-2 hover:bg-background rounded transition-colors"
          >
            <Plus size={16} className="text-foreground" aria-hidden="true" />
          </button>
        </div>
        <button
          onClick={onRemove}
          aria-label={`Remove ${item.name} from cart`}
          className="p-2 text-destructive hover:text-destructive/80 transition-colors mt-1"
        >
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </div>
    </Card>
  )
}
