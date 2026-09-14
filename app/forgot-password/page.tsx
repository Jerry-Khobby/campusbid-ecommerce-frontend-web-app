"use client"

import type React from "react"
import { useState } from "react"
import { Mail } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNotification } from "@/lib/notification-context"
import { requestPasswordReset } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addNotification } = useNotification()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    try {
      await requestPasswordReset(email)
      setIsSubmitted(true)
      addNotification("Password reset link sent to your email!", "success")
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Forgot Password</h1>
            <p className="text-muted-foreground">
              {isSubmitted
                ? "Check your email for reset instructions"
                : "Enter your email to receive a password reset link"}
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    size={18}
                  />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
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
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-4xl mb-2">📧</div>
                <p className="text-sm text-muted-foreground">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
              </div>
              <Button onClick={() => setIsSubmitted(false)} variant="outline" className="w-full">
                Try Another Email
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-accent hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </Card>
    </main>
  )
}
