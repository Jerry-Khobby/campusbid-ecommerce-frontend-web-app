"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Bell } from "lucide-react"
import { useUser } from "@/lib/user-context"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { NotificationsPanel } from "@/components/notifications-panel"
import { fetchNotifications, notificationsQueryKey } from "@/lib/api/notifications"

const MAX_BADGE_COUNT = 9

/** Persistent bell shown on every page while logged in - unlike the
 * Profile > Notifications tab, this is reachable from anywhere in the app. */
export function NotificationBell() {
  const { isLoggedIn } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const { data: notifications } = useQuery({
    queryKey: notificationsQueryKey,
    queryFn: fetchNotifications,
    enabled: isLoggedIn,
  })

  if (!isLoggedIn) return null

  const unreadCount = notifications?.filter((notification) => !notification.isRead).length ?? 0

  return (
    <div className="fixed top-3 right-3 z-40">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-md border border-border hover:bg-muted transition-colors"
          >
            <Bell size={20} className="text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                {unreadCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 max-h-[70vh] overflow-y-auto">
          <NotificationsPanel onNavigate={() => setIsOpen(false)} />
        </PopoverContent>
      </Popover>
    </div>
  )
}
