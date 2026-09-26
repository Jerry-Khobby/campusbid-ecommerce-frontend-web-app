"use client"

import { Suspense } from "react"
import LoginPage from "@/components/pages/login-page"

export default function Login() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  )
}
