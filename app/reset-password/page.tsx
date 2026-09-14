"use client"

import type React from "react"
import { useState } from "react"
import { Lock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNotification } from "@/lib/notification-context"
import { resetPassword } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"
import { useRouter, useSearchParams } from "next/navigation"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addNotification } = useNotification()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || !confirmPassword) return
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
              <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  type="password"
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

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Password must be at least 8 characters long and include uppercase, lowercase, and numbers
            </p>
          </div>
        </div>
      </Card>
    </main>
  )
}
