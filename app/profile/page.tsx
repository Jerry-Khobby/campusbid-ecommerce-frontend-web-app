"use client"

import ProfilePage from "@/components/pages/profile-page"
import { Suspense } from "react"
import { useRequireAuth } from "@/hooks/use-require-auth"

export default function Profile() {
  const isLoggedIn = useRequireAuth("Please log in to view your profile")

  if (!isLoggedIn) {
    return null
  }

  // The page reads its query string (useSearchParams), which needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <ProfilePage />
    </Suspense>
  )
}
