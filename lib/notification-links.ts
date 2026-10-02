import type { AppNotification } from "./api/notifications"

const ORDER_NOTIFICATION_TYPES: AppNotification["type"][] = ["order_update", "order_status_changed", "payment"]

/** Where a notification should take the customer when they open it, or null when it is informational only. */
export function getNotificationLink(notification: AppNotification): string | null {
  if (notification.type.startsWith("flash_sale")) return "/flash-sales"
  if (notification.type === "new_message") return "/chat"
  if (ORDER_NOTIFICATION_TYPES.includes(notification.type) || notification.data?.orderId) return "/orders"
  return null
}
