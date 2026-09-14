"use client"

import { useEffect, useState } from "react"

/**
 * Returns `value`, delayed until `delayMs` has passed without it changing again.
 * Used to avoid firing a server request on every keystroke of a search input.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delayMs)
    return () => clearTimeout(timeoutId)
  }, [value, delayMs])

  return debouncedValue
}
