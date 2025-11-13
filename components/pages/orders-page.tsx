"use client"

import { useState } from "react"
import { CheckCircle2, Clock, Truck, Package, Phone, MapPin, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useOrders } from "@/lib/orders-context"

export default function OrdersPage() {
  const { orders, confirmDelivery } = useOrders()
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ordered":
        return <Package size={20} className="text-muted-foreground" />
      case "prepared":
        return <Clock size={20} className="text-muted-foreground" />
      case "out-for-delivery":
        return <Truck size={20} className="text-accent" />
      case "delivered":
        return <CheckCircle2 size={20} className="text-green-500" />
      default:
        return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ordered":
        return "Ordered"
      case "prepared":
        return "Prepared"
      case "out-for-delivery":
        return "Out for Delivery"
      case "delivered":
        return "Delivered"
      default:
        return ""
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ordered":
        return "bg-muted"
      case "prepared":
        return "bg-muted"
      case "out-for-delivery":
        return "bg-accent/10"
      case "delivered":
        return "bg-green-50"
      default:
        return "bg-muted"
    }
  }

  return (
    <main className="w-full max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Your Orders</h1>
        <p className="text-muted-foreground">Track your purchases and confirm deliveries</p>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => (
          <Card
            key={order.id}
            className={`p-4 hover:shadow-lg transition-shadow cursor-pointer ${getStatusColor(order.status)}`}
            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
          >
            {/* Order Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Order {order.id}</p>
                <h3 className="font-semibold text-foreground">{order.items}</h3>
                <p className="text-sm text-muted-foreground">{order.vendor}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-accent">${order.total.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{order.date}</p>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
              {getStatusIcon(order.status)}
              <span className="text-sm font-medium text-foreground">{getStatusLabel(order.status)}</span>
              {order.paymentStatus === "held" && (
                <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full ml-auto">Payment Held</span>
              )}
              {order.paymentStatus === "released" && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-auto">
                  Payment Released
                </span>
              )}
            </div>

            {/* Expanded Details */}
            {expandedOrder === order.id && (
              <div className="space-y-4 pt-4 border-t border-border">
                {/* Estimated Delivery */}
                <div className="flex items-start gap-3">
                  <Clock size={18} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Estimated Delivery</p>
                    <p className="font-semibold text-foreground">{order.estimatedDelivery}</p>
                  </div>
                </div>

                {/* Tracking Number */}
                <div className="flex items-start gap-3">
                  <Package size={18} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tracking Number</p>
                    <p className="font-semibold text-foreground font-mono">{order.trackingNumber}</p>
                  </div>
                </div>

                {/* Vendor Contact */}
                <div className="flex items-start gap-3">
                  <Phone size={18} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Vendor Contact</p>
                    <p className="font-semibold text-foreground">{order.vendorPhone}</p>
                  </div>
                </div>

                {/* Delivery Location */}
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery Location</p>
                    <p className="font-semibold text-foreground">Campus Dormitory - Building A</p>
                  </div>
                </div>

                {/* Status Timeline Visual */}
                <div className="my-4 space-y-2">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-accent" />
                      <div className="w-0.5 h-8 bg-accent" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Order Placed</p>
                      <p className="text-xs text-muted-foreground">Today at 1:00 PM</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${order.status === "prepared" || order.status === "out-for-delivery" || order.status === "delivered" ? "bg-accent" : "bg-muted"}`}
                      />
                      <div
                        className={`w-0.5 h-8 ${order.status === "out-for-delivery" || order.status === "delivered" ? "bg-accent" : "bg-muted"}`}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Being Prepared</p>
                      <p className="text-xs text-muted-foreground">
                        {order.status === "prepared" ||
                        order.status === "out-for-delivery" ||
                        order.status === "delivered"
                          ? "Completed"
                          : "In progress"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${order.status === "out-for-delivery" || order.status === "delivered" ? "bg-accent" : "bg-muted"}`}
                      />
                      <div className={`w-0.5 h-8 ${order.status === "delivered" ? "bg-accent" : "bg-muted"}`} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Out for Delivery</p>
                      <p className="text-xs text-muted-foreground">
                        {order.status === "out-for-delivery" || order.status === "delivered"
                          ? "In progress"
                          : "Pending"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${order.status === "delivered" ? "bg-green-500" : "bg-muted"}`}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Delivered</p>
                      <p className="text-xs text-muted-foreground">
                        {order.status === "delivered" ? "Completed" : "Pending"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                {order.paymentStatus === "held" && (
                  <Card className="p-3 bg-accent/10 border border-accent/20 flex items-start gap-2">
                    <AlertCircle size={16} className="text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-accent">Secure Payment Hold</p>
                      <p className="text-xs text-accent/80">
                        Your payment is securely held and will be released to the vendor once you confirm delivery.
                      </p>
                    </div>
                  </Card>
                )}

                {/* Action Buttons */}
                {order.status === "delivered" && order.paymentStatus === "held" && (
                  <Button
                    onClick={() => confirmDelivery(order.id)}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                  >
                    Confirm Delivery & Release Payment
                  </Button>
                )}

                {order.status === "out-for-delivery" && (
                  <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
                    Contact Vendor
                  </Button>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </main>
  )
}
