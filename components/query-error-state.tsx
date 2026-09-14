"use client"

import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api/client"

const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again."

/** Extracts a user-facing message from a failed query's error, falling back to a generic one. */
export function getApiErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : DEFAULT_ERROR_MESSAGE
}

interface QueryErrorStateProps {
  message: string
  onRetry: () => void
}

/** Shown in place of query results when a request fails, with a retry action. */
export function QueryErrorState({ message, onRetry }: QueryErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <AlertCircle className="text-destructive" size={32} />
      <p className="text-muted-foreground">{message}</p>
      <Button onClick={onRetry} variant="outline">
        Try again
      </Button>
    </div>
  )
}
