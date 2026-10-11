"use client"

import type React from "react"
import { Suspense, useState } from "react"
import { Lock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { useNotification } from "@/lib/notification-context"
import { resetPassword } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { isStrongPassword } from "@/lib/password-rules"
import { PasswordRequirements } from "@/components/password-requirements"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageInner />
    </Suspense>
  )
}

function ResetPasswordPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addNotification } = useNotification()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || !confirmPassword) {
      addNotification("Enter and confirm your new password", "error")
      return
    }
    if (!isStrongPassword(password)) {
      addNotification("Your password doesn't meet all the requirements listed below it", "error")
      return
    }
    if (password !== confirmPassword) {
      addNotification("Passwords do not match", "error")
      return
    }
    if (!token) {
      addNotification("This reset link is invalid or has expired", "error")
      return
    }

    setIsSubmitting(true)
    try {
      await resetPassword(token, password)
      addNotification("Password reset successfully!", "success")
      router.push("/login")
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Something went wrong, please try again"
      addNotification(message, "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Without a token there's nothing to reset; say so before the user fills in
  // the form, rather than only after they submit it.
  if (!token) {
    return (
      <main className="w-full min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">This reset link isn&apos;t valid</h1>
            <p className="text-muted-foreground mb-6">
              It may be incomplete or have expired. Request a new link and open it straight from the email.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex w-full items-center justify-center rounded-md bg-accent px-4 py-2 font-semibold text-accent-foreground hover:bg-accent/90"
            >
              Request a new link
            </Link>
            <Link href="/login" className="inline-block mt-4 py-1 text-sm text-accent hover:underline">
              Back to Login
            </Link>
          </div>
        </Card>
      </main>
    )
  }

  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Reset Password</h1>
            <p className="text-muted-foreground">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-foreground mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <PasswordInput
                  id="new-password"
                  autoComplete="new-password"
                  aria-describedby="password-requirements"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                />
              </div>
              <PasswordRequirements id="password-requirements" password={password} />
            </div>

            <div>
              <label htmlFor="confirm-new-password" className="block text-sm font-medium text-foreground mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <PasswordInput
                  id="confirm-new-password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </div>
      </Card>
    </main>
  )
}
