"use client"

import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { useRouter } from "next/navigation"
import { DELIVERY_FEE } from "@/lib/constants"
import { OptimizedImage } from "@/components/optimized-image"
import { formatCurrency } from "@/lib/format"

export default function CartPage() {
  const router = useRouter()
  const { items, removeItem, updateQuantity, total } = useCart()

  if (items.length === 0) {
    return (
      <main className="w-full max-w-2xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Shopping Cart</h1>
          <p className="text-muted-foreground">Your items</p>
        </div>

        <div className="flex flex-col items-center justify-center py-16">
          <ShoppingBag size={48} className="text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">Your cart is empty</p>
          <p className="text-sm text-muted-foreground text-center mt-2">Start shopping to add items</p>
        </div>
      </main>
    )
  }

  return (
    <main className="w-full max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Shopping Cart</h1>
        <p className="text-muted-foreground">{items.length} item(s)</p>
      </div>

      {/* Cart Items */}
      <div className="space-y-4 mb-8">
        {items.map((item) => (
          <Card key={item.id} className="p-4 flex-row gap-4">
            {/* Image */}
            <div className="w-20 h-20 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
              <OptimizedImage src={item.image} alt={item.name} className="w-full h-full" />
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{item.name}</h3>
                <p className="text-sm text-muted-foreground">{item.vendor}</p>
              </div>
              <p className="font-bold text-accent">{formatCurrency(item.price)}</p>
            </div>

            {/* Quantity Controls */}
            <div className="flex flex-col items-center justify-between">
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="p-1 hover:bg-background rounded transition-colors"
                >
                  <Minus size={16} className="text-foreground" />
                </button>
                <span className="w-8 text-center font-semibold text-foreground">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="p-1 hover:bg-background rounded transition-colors"
                >
                  <Plus size={16} className="text-foreground" />
                </button>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-destructive hover:text-destructive/80 transition-colors mt-2"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card className="p-6 bg-card mb-6">
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-foreground">
            <span>Subtotal</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-foreground">
            <span>Delivery Fee</span>
            <span>{formatCurrency(DELIVERY_FEE)}</span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between font-bold text-lg text-foreground">
            <span>Total</span>
            <span className="text-accent">{formatCurrency(total + DELIVERY_FEE)}</span>
          </div>
        </div>

        <Button
          onClick={() => router.push("/checkout")}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-6"
        >
          Proceed to Checkout
        </Button>
      </Card>
    </main>
  )
}
