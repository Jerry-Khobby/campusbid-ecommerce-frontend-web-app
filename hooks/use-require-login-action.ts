"use client"

import { useRouter } from "next/navigation"
import { useUser } from "@/lib/user-context"
import { useNotification } from "@/lib/notification-context"

/**
 * Returns a `requireLogin` guard for actions that only make sense when logged
 * in (saving an item, chatting with a vendor, placing a bid). If the visitor
 * isn't logged in, it shows `message` and redirects to /login instead of
 * running `action`.
 */
export function useRequireLoginAction() {
  const { isLoggedIn } = useUser()
  const router = useRouter()
  const { addNotification } = useNotification()

  return function requireLogin(message: string, action: () => void) {
    if (!isLoggedIn) {
      addNotification(message, "info")
      router.push("/login")
      return
    }
    action()
  }
}
