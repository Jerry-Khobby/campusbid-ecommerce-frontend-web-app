"use client"

import { useNotification, type Notification } from "@/lib/notification-context"

export default function NotificationToast() {
  const { notifications, removeNotification } = useNotification()

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <span className="text-xl" aria-hidden="true">✅</span>
      case "error":
        return <span className="text-xl" aria-hidden="true">❌</span>
      case "warning":
        return <span className="text-xl" aria-hidden="true">⚠️</span>
      default:
        return <span className="text-xl" aria-hidden="true">ℹ️</span>
    }
  }

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 space-y-2 pointer-events-none" aria-live="polite">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          role={notification.type === "error" ? "alert" : "status"}
          className="bg-card border border-border rounded-lg shadow-lg p-4 flex items-center gap-3 pointer-events-auto sm:max-w-sm ml-auto animate-in fade-in slide-in-from-top-2"
        >
          {getIcon(notification.type)}
          <p className="text-sm font-medium text-foreground flex-1">{notification.message}</p>
          {notification.action && (
            <button
              onClick={() => {
                notification.action?.onClick()
                removeNotification(notification.id)
              }}
              className="text-sm font-semibold text-accent hover:underline px-2 py-1"
            >
              {notification.action.label}
            </button>
          )}
          <button
            onClick={() => removeNotification(notification.id)}
            aria-label="Dismiss notification"
            className="text-muted-foreground hover:text-foreground transition-colors text-lg p-1"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
