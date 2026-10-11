"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { Loader2 } from "lucide-react"
import { getPendingRequestCount, subscribeToPendingRequests } from "@/lib/api/client"

// The backend sleeps when idle and can take most of a minute to wake. Past
// this point a request is almost certainly waiting on that, not just slow.
const SLOW_REQUEST_THRESHOLD_MS = 5000

/** Explains a long wait instead of leaving the user staring at skeletons. */
export function ServerWakeBanner() {
  const pendingCount = useSyncExternalStore(subscribeToPendingRequests, getPendingRequestCount, () => 0)
  const isBusy = pendingCount > 0
  const [isSlow, setIsSlow] = useState(false)

  useEffect(() => {
    if (!isBusy) {
      setIsSlow(false)
      return
    }
    const timer = setTimeout(() => setIsSlow(true), SLOW_REQUEST_THRESHOLD_MS)
    return () => clearTimeout(timer)
  }, [isBusy])

  if (!isSlow) return null

  return (
    <div
      role="status"
      className="fixed bottom-24 md:bottom-28 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-max z-40 bg-card border border-border rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 text-sm text-foreground"
    >
      <Loader2 size={16} className="animate-spin text-accent flex-shrink-0" aria-hidden="true" />
      <span>Waking up the server. The first load can take up to a minute.</span>
    </div>
  )
}
