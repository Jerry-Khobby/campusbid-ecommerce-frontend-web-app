"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface ButtonWithLoaderProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>
  children: React.ReactNode
  className?: string
  variant?: "default" | "outline" | "destructive"
  disabled?: boolean
  loadingDuration?: number
}

export function ButtonWithLoader({
  onClick,
  children,
  className,
  variant = "default",
  disabled = false,
  loadingDuration = 1500,
}: ButtonWithLoaderProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsLoading(true)
    try {
      if (onClick) {
        await onClick(e)
      }
    } finally {
      setTimeout(() => setIsLoading(false), loadingDuration)
    }
  }

  return (
    <Button onClick={handleClick} disabled={disabled || isLoading} className={className} variant={variant}>
      {isLoading ? (
        <>
          <Loader2 size={16} className="animate-spin mr-2" />
          Processing...
        </>
      ) : (
        children
      )}
    </Button>
  )
}
