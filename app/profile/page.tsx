"use client"

import ProfilePage from "@/components/pages/profile-page"
import { useUser } from "@/lib/user-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useNotification } from "@/lib/notification-context"

export default function Profile() {
  const { isLoggedIn } = useUser()
  const router = useRouter()
  const { addNotification } = useNotification()

  useEffect(() => {
    if (!isLoggedIn) {
      addNotification("Please log in to view your profile", "info")
      router.push("/login")
    }
  }, [isLoggedIn, router, addNotification])

  if (!isLoggedIn) {
    return null
  }

  return <ProfilePage />
}
