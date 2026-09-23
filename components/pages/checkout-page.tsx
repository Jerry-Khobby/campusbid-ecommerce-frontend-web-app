"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Lock, MapPin } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useCart, type CartItem } from "@/lib/cart-context"
import { useUser } from "@/lib/user-context"
import { useNotification } from "@/lib/notification-context"
import { ApiError } from "@/lib/api/client"
import { useCreateOrder } from "@/lib/api/orders"
import { useInitializePayment, type PaymentMethod } from "@/lib/api/payments"
import { DELIVERY_FEE, SERVICE_FEE } from "@/lib/constants"

type CheckoutStep = "address" | "payment"

function groupItemsByVendor(items: CartItem[]): Map<string, CartItem[]> {
  const groups = new Map<string, CartItem[]>()
  for (const item of items) {
    const group = groups.get(item.vendorId) ?? []
    group.push(item)
    groups.set(item.vendorId, group)
  }
  return groups
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart } = useCart()
  const { user } = useUser()
  const { addNotification } = useNotification()
  const createOrder = useCreateOrder()
  const initializePayment = useInitializePayment()

  const vendorGroups = useMemo(() => groupItemsByVendor(items), [items])
  const singleVendorItems = vendorGroups.size === 1 ? [...vendorGroups.values()][0] : []
  const vendorId = singleVendorItems[0]?.vendorId ?? ""

  const [step, setStep] = useState<CheckoutStep>("address")
  const [addressId, setAddressId] = useState(() => user?.addresses.find((a) => a.isDefault)?._id ?? user?.addresses[0]?._id ?? "")
  const [customerNotes, setCustomerNotes] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card")

  const selectedAddress = user?.addresses.find((a) => a._id === addressId)
  const subtotal = singleVendorItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal + DELIVERY_FEE + SERVICE_FEE
  const isPlacingOrder = createOrder.isPending || initializePayment.isPending

  const handlePlaceOrder = async () => {
    if (!selectedAddress) return

    try {
      const order = await createOrder.mutateAsync({
        vendorId,
        items: singleVendorItems.map((item) => ({
          productId: item.id,
          productName: item.name,
          productImage: item.image,
          quantity: item.quantity,
          price: item.price,
        })),
        pricing: { subtotal, deliveryFee: DELIVERY_FEE, serviceFee: SERVICE_FEE, total },
        deliveryAddress: {
          label: selectedAddress.label,
          building: selectedAddress.building,
          room: selectedAddress.room,
          instructions: selectedAddress.instructions,
          location: selectedAddress.location,
        },
        customerNotes: customerNotes || undefined,
      })

      const payment = await initializePayment.mutateAsync({ orderId: order._id, paymentMethod })
      clearCart()
      window.location.href = payment.authorizationUrl
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Something went wrong placing your order."
      addNotification(message, "error")
    }
  }

  if (items.length === 0) {
    return (
      <main className="w-full max-w-2xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Checkout</h1>
        </div>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-6">Your cart is empty.</p>
          <Button onClick={() => router.push("/")} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Continue Shopping
          </Button>
        </Card>
      </main>
    )
  }

  if (vendorGroups.size > 1) {
    const vendorNames = [...vendorGroups.values()].map((group) => group[0].vendor)
    return (
      <main className="w-full max-w-2xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Checkout</h1>
        </div>
        <Card className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-2">One vendor at a time</h2>
          <p className="text-muted-foreground mb-4">
            Your cart has items from multiple vendors ({vendorNames.join(", ")}). Orders can only be placed with one
            vendor at a time — please remove items from the other vendors before checking out.
          </p>
          <Button onClick={() => router.push("/cart")} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            Go to Cart
          </Button>
        </Card>
      </main>
    )
  }

  if (!user || user.addresses.length === 0) {
    return (
      <main className="w-full max-w-2xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Checkout</h1>
        </div>
        <Card className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-2">Add a delivery address</h2>
          <p className="text-muted-foreground mb-4">
            You need a saved delivery address before you can check out.
          </p>
          <Button onClick={() => router.push("/profile")} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            Go to Profile
          </Button>
        </Card>
      </main>
    )
  }

  return (
    <main className="w-full max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <button onClick={() => router.push("/cart")} className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft size={24} className="text-foreground" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex gap-2 mb-8">
        <div className="flex-1 h-1 rounded-full bg-accent" />
        <div className={`flex-1 h-1 rounded-full ${step === "payment" ? "bg-accent" : "bg-muted"}`} />
      </div>

      {/* Address Step */}
      {step === "address" && (
        <div className="space-y-4 mb-8">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Delivery Address</h2>
            <RadioGroup value={addressId} onValueChange={setAddressId} className="space-y-3">
              {user.addresses.map((address) => (
                <Label
                  key={address._id}
                  htmlFor={address._id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer has-data-[state=checked]:border-accent has-data-[state=checked]:bg-accent/5"
                >
                  <RadioGroupItem value={address._id} id={address._id} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-muted-foreground" />
                      <span className="font-semibold text-foreground">{address.label || "Address"}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {[address.building, address.room].filter(Boolean).join(", ") || "No building/room details"}
                    </p>
                    {address.instructions && (
                      <p className="text-xs text-muted-foreground mt-1">{address.instructions}</p>
                    )}
                  </div>
                </Label>
              ))}
            </RadioGroup>

            <div className="mt-4">
              <label className="text-sm font-medium text-foreground block mb-2">Notes for the vendor (optional)</label>
              <Textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="E.g. leave at the front desk"
              />
            </div>
          </Card>

          <Button
            onClick={() => setStep("payment")}
            disabled={!selectedAddress}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-6"
          >
            Continue to Payment
          </Button>
        </div>
      )}

      {/* Payment Step */}
      {step === "payment" && (
        <div className="space-y-4 mb-8">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Payment Method</h2>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              className="space-y-3"
            >
              <Label
                htmlFor="card"
                className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer has-data-[state=checked]:border-accent has-data-[state=checked]:bg-accent/5"
              >
                <RadioGroupItem value="card" id="card" />
                <span className="font-medium text-foreground">Card</span>
              </Label>
              <Label
                htmlFor="mobile_money"
                className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer has-data-[state=checked]:border-accent has-data-[state=checked]:bg-accent/5"
              >
                <RadioGroupItem value="mobile_money" id="mobile_money" />
                <span className="font-medium text-foreground">Mobile Money</span>
              </Label>
            </RadioGroup>
          </Card>

          <Card className="p-4 bg-accent/10 border border-accent/20 flex-row items-start gap-3">
            <Lock size={20} className="text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Secure Payment</p>
              <p className="text-xs text-muted-foreground">
                You'll be redirected to Paystack to complete payment. Your payment is held until delivery is
                confirmed.
              </p>
            </div>
          </Card>

          <Button
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-6"
          >
            {isPlacingOrder ? "Placing Order..." : "Place Order"}
          </Button>
        </div>
      )}

      {/* Order Summary */}
      <Card className="p-6 bg-muted">
        <h3 className="font-bold text-foreground mb-4">Order Summary</h3>
        <div className="space-y-3">
          {singleVendorItems.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-foreground">
                {item.name} x{item.quantity}
              </span>
              <span className="font-semibold text-foreground">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-border pt-3 space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Delivery Fee</span>
              <span>${DELIVERY_FEE.toFixed(2)}</span>
            </div>
            {SERVICE_FEE > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Service Fee</span>
                <span>${SERVICE_FEE.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-foreground pt-1">
              <span>Total</span>
              <span className="text-accent">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>
    </main>
  )
}
