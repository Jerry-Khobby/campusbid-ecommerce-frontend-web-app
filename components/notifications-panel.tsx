"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Bell, Check, CheckCheck, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api/client"
import { useNotification } from "@/lib/notification-context"
import {
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

/** The notification list + mark-read/delete actions, shared between the
 * profile page's Notifications tab and the persistent header bell. */
export function NotificationsPanel() {
  const { addNotification } = useNotification()
  const queryClient = useQueryClient()

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
    onSuccess: () => {
      invalidateNotifications()
      addNotification("Notification deleted", "info")
    },
    onError: (error) => addNotification(getErrorMessage(error, "Failed to delete notification"), "error"),
  })

  if (notificationsQuery.isLoading) return <p className="text-sm text-muted-foreground p-4">Loading notifications...</p>

  const notifications = notificationsQuery.data ?? []
  const hasUnread = notifications.some((notification) => !notification.isRead)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => markAllReadMutation.mutate()}
          disabled={!hasUnread || markAllReadMutation.isPending}
          className="bg-muted hover:bg-muted/80 text-foreground font-semibold flex items-center gap-2 text-sm"
        >
          <CheckCheck size={16} />
          Mark all read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <Card className="p-8 text-center">
          <Bell size={32} className="mx-auto text-muted-foreground mb-2 opacity-50" />
          <p className="text-muted-foreground">No notifications yet</p>
        </Card>
      ) : (
        notifications.map((notification) => (
          <NotificationCard
            key={notification._id}
            notification={notification}
            onMarkRead={() => markReadMutation.mutate(notification._id)}
            onDelete={() => deleteNotificationMutation.mutate(notification._id)}
          />
        ))
      )}
    </div>
  )
}

function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: AppNotification
  onMarkRead: () => void
  onDelete: () => void
}) {
  return (
    <Card className={`p-3 md:p-4 ${notification.isRead ? "" : "border-accent bg-accent/5"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {!notification.isRead && <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />}
            <p className="font-semibold text-foreground text-sm md:text-base truncate">{notification.title}</p>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
          <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(notification.createdAt)}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!notification.isRead && (
            <button onClick={onMarkRead} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Check size={16} className="text-muted-foreground" />
            </button>
          )}
          <button onClick={onDelete} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </Card>
  )
}
