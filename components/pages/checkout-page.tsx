"use client"

import type React from "react"
import { useState } from "react"
import { ArrowLeft, Lock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart } from "@/lib/cart-context"
import { useRouter } from "next/navigation"
import { DELIVERY_FEE } from "@/lib/constants"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clearCart } = useCart()
  const [step, setStep] = useState<"address" | "payment" | "confirmation">("address")
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddressSubmit = () => {
    if (formData.fullName && formData.email && formData.address && formData.city && formData.zipCode) {
      setStep("payment")
    }
  }

  const handlePaymentSubmit = () => {
    if (formData.cardNumber && formData.expiryDate && formData.cvv) {
      setStep("confirmation")
    }
  }

  const handleCompleteOrder = () => {
    clearCart()
    router.push("/orders")
  }

  if (step === "confirmation") {
    return (
      <main className="w-full max-w-2xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Order Confirmed</h1>
        </div>

        <Card className="p-8 text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Payment Held Securely</h2>
          <p className="text-muted-foreground mb-6">
            Your payment is secure and will be released once the vendor confirms delivery.
          </p>

          <div className="bg-muted p-4 rounded-lg mb-6 text-left">
            <p className="text-sm text-muted-foreground mb-2">Order Number</p>
            <p className="font-bold text-foreground text-lg">
              ORD-{Math.random().toString(36).slice(2, 11).toUpperCase()}
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg mb-6 text-left">
            <p className="text-sm text-muted-foreground mb-2">Total Amount</p>
            <p className="font-bold text-accent text-lg">${(total + DELIVERY_FEE).toFixed(2)}</p>
          </div>

          <Button
            onClick={handleCompleteOrder}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-6"
          >
            Continue Shopping
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
      {/* Only "address"/"payment" reach this point — "confirmation" returns its own page above. */}
      <div className="flex gap-2 mb-8">
        <div className="flex-1 h-1 rounded-full bg-accent" />
        <div className={`flex-1 h-1 rounded-full ${step === "payment" ? "bg-accent" : "bg-muted"}`} />
        <div className="flex-1 h-1 rounded-full bg-muted" />
      </div>

      {/* Address Step */}
      {step === "address" && (
        <div className="space-y-4 mb-8">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Delivery Address</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Full Name</label>
                <Input name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="John Doe" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Email</label>
                <Input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@university.edu"
                  type="email"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Phone</label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Address</label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123 Campus St"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">City</label>
                  <Input name="city" value={formData.city} onChange={handleInputChange} placeholder="Boston" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">ZIP Code</label>
                  <Input name="zipCode" value={formData.zipCode} onChange={handleInputChange} placeholder="02115" />
                </div>
              </div>
            </div>
          </Card>

          <Button
            onClick={handleAddressSubmit}
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
            <h2 className="text-xl font-bold text-foreground mb-4">Payment Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Card Number</label>
                <Input
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012 3456"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Expiry Date</label>
                  <Input
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    placeholder="MM/YY"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">CVV</label>
                  <Input name="cvv" value={formData.cvv} onChange={handleInputChange} placeholder="123" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-accent/10 border border-accent/20 flex items-start gap-3">
            <Lock size={20} className="text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Secure Payment</p>
              <p className="text-xs text-muted-foreground">
                Your payment is encrypted and secure. It will be held until delivery is confirmed.
              </p>
            </div>
          </Card>

          <Button
            onClick={handlePaymentSubmit}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-6"
          >
            Complete Order
          </Button>
        </div>
      )}

      {/* Order Summary */}
      <Card className="p-6 bg-muted">
        <h3 className="font-bold text-foreground mb-4">Order Summary</h3>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-foreground">
                {item.name} x{item.quantity}
              </span>
              <span className="font-semibold text-foreground">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-border pt-3 flex justify-between font-bold text-foreground">
            <span>Total</span>
            <span className="text-accent">${(total + DELIVERY_FEE).toFixed(2)}</span>
          </div>
        </div>
      </Card>
    </main>
  )
}
