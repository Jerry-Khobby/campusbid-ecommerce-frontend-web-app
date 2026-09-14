"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useUser } from "@/lib/user-context"
import { useNotification } from "@/lib/notification-context"
import { createSocket } from "@/lib/socket/client"
import { notificationsQueryKey, type AppNotification } from "@/lib/api/notifications"

/**
 * Mounted once near the app root. Connects to the backend's authenticated
 * /notifications socket while the user is logged in, and on `new_notification`
 * both surfaces the existing toast UI and updates the notifications query
 * cache so an open notifications list picks it up without a manual refetch.
 */
export function NotificationsSocketBridge() {
  const { isLoggedIn } = useUser()
  const { addNotification } = useNotification()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isLoggedIn) return

    const socket = createSocket("/notifications", { withAuth: true })

    socket.on("new_notification", (notification: AppNotification) => {
      addNotification(`${notification.title}: ${notification.message}`, "info")
      queryClient.setQueryData<AppNotification[]>(notificationsQueryKey, (previous) =>
        previous ? [notification, ...previous] : [notification],
      )
    })

    socket.connect()
    return () => {
      socket.disconnect()
    }
  }, [isLoggedIn, addNotification, queryClient])

  return null
}
