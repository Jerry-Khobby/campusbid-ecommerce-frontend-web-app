"use client"

import { Suspense } from "react"
import GoogleCallbackPage from "@/components/pages/google-callback-page"

export default function GoogleCallback() {
  return (
    <Suspense fallback={null}>
      <GoogleCallbackPage />
    </Suspense>
  )
}
