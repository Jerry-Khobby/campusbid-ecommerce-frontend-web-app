"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

export interface OrderItem {
  id: string
  items: string
  vendor: string
  vendorPhone: string
  total: number
  status: "ordered" | "prepared" | "out-for-delivery" | "delivered"
  date: string
  estimatedDelivery: string
  trackingNumber: string
  paymentStatus: "held" | "released"
}

interface OrdersContextType {
  orders: OrderItem[]
  addOrder: (order: OrderItem) => void
  updateOrderStatus: (id: string, status: OrderItem["status"]) => void
  confirmDelivery: (id: string) => void
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined)

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<OrderItem[]>([
    {
      id: "ORD-001",
      items: "Coffee & Pastry Bundle",
      vendor: "Campus Cafe",
      vendorPhone: "+1 (555) 123-4567",
      total: 8.99,
      status: "out-for-delivery",
      date: "Today",
      estimatedDelivery: "2:30 PM",
      trackingNumber: "TRACK-001",
      paymentStatus: "held",
    },
    {
      id: "ORD-002",
      items: "Textbook - Biology 101",
      vendor: "Student Books",
      vendorPhone: "+1 (555) 234-5678",
      total: 45.0,
      status: "prepared",
      date: "Yesterday",
      estimatedDelivery: "Tomorrow 10:00 AM",
      trackingNumber: "TRACK-002",
      paymentStatus: "held",
    },
    {
      id: "ORD-003",
      items: "Laptop Charger",
      vendor: "Tech Store",
      vendorPhone: "+1 (555) 345-6789",
      total: 35.99,
      status: "delivered",
      date: "2 days ago",
      estimatedDelivery: "Delivered",
      trackingNumber: "TRACK-003",
      paymentStatus: "released",
    },
  ])

  const addOrder = (order: OrderItem) => {
    setOrders((prev) => [order, ...prev])
  }

  const updateOrderStatus = (id: string, status: OrderItem["status"]) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id
          ? {
              ...order,
              status,
              paymentStatus: status === "delivered" ? "held" : order.paymentStatus,
            }
          : order,
      ),
    )
  }

  const confirmDelivery = (id: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id
          ? {
              ...order,
              status: "delivered",
              paymentStatus: "released",
            }
          : order,
      ),
    )
  }

  return (
    <OrdersContext.Provider value={{ orders, addOrder, updateOrderStatus, confirmDelivery }}>
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrders() {
  const context = useContext(OrdersContext)
  if (!context) {
    throw new Error("useOrders must be used within OrdersProvider")
  }
  return context
}
