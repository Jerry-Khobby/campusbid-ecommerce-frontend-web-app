"use client"

import ProfilePage from "@/components/pages/profile-page"
import { useRequireAuth } from "@/hooks/use-require-auth"

export default function Profile() {
  const isLoggedIn = useRequireAuth("Please log in to view your profile")

  if (!isLoggedIn) {
    return null
  }

  return <ProfilePage />
}
