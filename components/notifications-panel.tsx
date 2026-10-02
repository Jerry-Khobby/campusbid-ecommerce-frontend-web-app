"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api/client"
import { useNotification } from "@/lib/notification-context"
import { getNotificationLink } from "@/lib/notification-links"
import {
  clearAllNotifications,
  deleteNotification,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  notificationsQueryKey,
  type AppNotification,
} from "@/lib/api/notifications"

const SECONDS_PER_MINUTE = 60
const SECONDS_PER_HOUR = 3600
const SECONDS_PER_DAY = 86400

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

function formatRelativeTime(isoDate: string): string {
  const elapsedSeconds = Math.max(0, (Date.now() - new Date(isoDate).getTime()) / 1000)

  if (elapsedSeconds < SECONDS_PER_MINUTE) return "just now"
  if (elapsedSeconds < SECONDS_PER_HOUR) return `${Math.floor(elapsedSeconds / SECONDS_PER_MINUTE)}m ago`
  if (elapsedSeconds < SECONDS_PER_DAY) return `${Math.floor(elapsedSeconds / SECONDS_PER_HOUR)}h ago`
  return `${Math.floor(elapsedSeconds / SECONDS_PER_DAY)}d ago`
}

/** The notification list and its actions, shared between the profile page's
 * Notifications tab and the persistent header bell. `onNavigate` lets the
 * bell close itself when a notification takes the customer somewhere. */
export function NotificationsPanel({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter()
  const { addNotification } = useNotification()
  const queryClient = useQueryClient()
  const [isConfirmingClear, setIsConfirmingClear] = useState(false)

  const notificationsQuery = useQuery({ queryKey: notificationsQueryKey, queryFn: fetchNotifications })
  const invalidateNotifications = () => queryClient.invalidateQueries({ queryKey: notificationsQueryKey })

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: invalidateNotifications,
    onError: (error) => addNotification(getErrorMessage(error, "Failed to mark notification as read"), "error"),
  })

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      invalidateNotifications()
      addNotification("All notifications marked as read", "success")
    },
    onError: (error) => addNotification(getErrorMessage(error, "Failed to mark all as read"), "error"),
  })

  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: invalidateNotifications,
    onError: (error) => addNotification(getErrorMessage(error, "Failed to delete notification"), "error"),
  })

  const clearAllMutation = useMutation({
    mutationFn: clearAllNotifications,
    onSuccess: () => {
      setIsConfirmingClear(false)
      invalidateNotifications()
      addNotification("Notifications cleared", "info")
    },
    onError: (error) => addNotification(getErrorMessage(error, "Failed to clear notifications"), "error"),
  })

  const openNotification = (notification: AppNotification) => {
    if (!notification.isRead) markReadMutation.mutate(notification._id)
    const link = getNotificationLink(notification)
    if (!link) return
    onNavigate?.()
    router.push(link)
  }

  if (notificationsQuery.isLoading) return <p className="text-sm text-muted-foreground p-4">Loading notifications...</p>

  const notifications = notificationsQuery.data ?? []
  const unreadCount = notifications.filter((notification) => !notification.isRead).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">
          {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={unreadCount === 0 || markAllReadMutation.isPending}
          >
            <CheckCheck size={14} />
            Mark all read
          </Button>
          {isConfirmingClear ? (
            <>
              <Button variant="destructive" size="sm" onClick={() => clearAllMutation.mutate()} disabled={clearAllMutation.isPending}>
                Clear all?
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsConfirmingClear(false)}>
                Keep
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setIsConfirmingClear(true)} disabled={notifications.length === 0}>
              <Trash2 size={14} />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card className="p-8 text-center">
          <Bell size={32} className="mx-auto text-muted-foreground mb-2 opacity-50" />
          <p className="text-muted-foreground">No notifications yet</p>
          <p className="text-xs text-muted-foreground mt-1">Order updates, payments and flash sale results will show up here.</p>
        </Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">Tap a notification to open it. Opening one marks it as read.</p>
          {notifications.map((notification) => (
            <NotificationCard
              key={notification._id}
              notification={notification}
              onOpen={() => openNotification(notification)}
              onMarkRead={() => markReadMutation.mutate(notification._id)}
              onDelete={() => deleteNotificationMutation.mutate(notification._id)}
            />
          ))}
        </>
      )}
    </div>
  )
}

interface NotificationCardProps {
  notification: AppNotification
  onOpen: () => void
  onMarkRead: () => void
  onDelete: () => void
}

function NotificationCard({ notification, onOpen, onMarkRead, onDelete }: NotificationCardProps) {
  const stopThen = (action: () => void) => (event: React.MouseEvent) => {
    event.stopPropagation()
    action()
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onOpen()
      }}
      className={`p-3 md:p-4 cursor-pointer hover:shadow-md transition-shadow ${notification.isRead ? "" : "border-accent bg-accent/5"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {!notification.isRead && <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" aria-label="Unread" />}
            <p className="font-semibold text-foreground text-sm md:text-base truncate">{notification.title}</p>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
          <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(notification.createdAt)}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!notification.isRead && (
            <button
              onClick={stopThen(onMarkRead)}
              aria-label="Mark as read"
              title="Mark as read"
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Check size={16} className="text-muted-foreground" />
            </button>
          )}
          <button
            onClick={stopThen(onDelete)}
            aria-label="Delete notification"
            title="Delete notification"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </Card>
  )
}
