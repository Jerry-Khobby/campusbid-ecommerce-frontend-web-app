"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"

export interface NotificationAction {
  label: string
  onClick: () => void
}

export interface Notification {
  id: string
  message: string
  type: "success" | "info" | "warning" | "error"
  duration?: number
  action?: NotificationAction
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (
    message: string,
    type?: Notification["type"],
    duration?: number,
    action?: NotificationAction,
  ) => void
  removeNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Date.now() alone collides when two notifications fire within the same
// millisecond (e.g. two queries failing back-to-back on page load), producing
// duplicate React keys — this counter guarantees a unique id regardless of timing.
let notificationIdCounter = 0

// Errors and warnings usually tell the user to do something, so they stay up
// long enough to actually be read; confirmations can go quickly.
const DEFAULT_DURATION_MS: Record<Notification["type"], number> = {
  success: 3000,
  info: 3000,
  warning: 6000,
  error: 6000,
}

function createNotificationId(): string {
  notificationIdCounter += 1
  return `${Date.now()}-${notificationIdCounter}`
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const addNotification = useCallback((
    message: string,
    type: Notification["type"] = "info",
    duration: number = DEFAULT_DURATION_MS[type],
    action?: NotificationAction,
  ) => {
    const id = createNotificationId()
    const notification: Notification = { id, message, type, duration, action }

    setNotifications((prev) => [...prev, notification])

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
  }, [removeNotification])

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider")
  }
  return context
}
