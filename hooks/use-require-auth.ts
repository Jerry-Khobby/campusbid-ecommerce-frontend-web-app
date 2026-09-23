"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useUser } from "@/lib/user-context"
import { useNotification } from "@/lib/notification-context"

/**
 * Redirects an unauthenticated visitor to /login, preserving the current
 * path so the login page can send them back here afterwards, and shows a
 * notification explaining why. Returns whether the user is currently logged in.
 */
export function useRequireAuth(message: string): boolean {
  const { isLoggedIn, isLoading } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const { addNotification } = useNotification()

  useEffect(() => {
    // Still checking for a persisted session — isLoggedIn is only reliable once this resolves.
    if (isLoading) return

    if (!isLoggedIn) {
      addNotification(message, "info")
      const params = new URLSearchParams({ redirect: pathname })
      router.push(`/login?${params.toString()}`)
    }
  }, [isLoggedIn, isLoading, router, addNotification, message, pathname])

  return isLoggedIn
}
