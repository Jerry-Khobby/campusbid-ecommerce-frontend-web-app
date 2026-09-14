"use client"

import { useEffect, useState } from "react"

const TICK_MS = 1000
const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60

export interface Countdown {
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
  label: string
}

function getRemainingMs(endTime: string | Date): number {
  const endMs = typeof endTime === "string" ? new Date(endTime).getTime() : endTime.getTime()
  return Math.max(0, endMs - Date.now())
}

function formatUnit(unit: number): string {
  return unit.toString().padStart(2, "0")
}

function toCountdown(remainingMs: number): Countdown {
  const totalSeconds = Math.floor(remainingMs / TICK_MS)
  const hours = Math.floor(totalSeconds / (SECONDS_PER_MINUTE * MINUTES_PER_HOUR))
  const minutes = Math.floor((totalSeconds % (SECONDS_PER_MINUTE * MINUTES_PER_HOUR)) / SECONDS_PER_MINUTE)
  const seconds = totalSeconds % SECONDS_PER_MINUTE

  return {
    hours,
    minutes,
    seconds,
    isExpired: remainingMs <= 0,
    label: `${formatUnit(hours)}:${formatUnit(minutes)}:${formatUnit(seconds)}`,
  }
}

/** Ticks every second, deriving hours/minutes/seconds remaining until `endTime`. */
export function useCountdown(endTime: string | Date): Countdown {
  const [countdown, setCountdown] = useState<Countdown>(() => toCountdown(getRemainingMs(endTime)))

  useEffect(() => {
    setCountdown(toCountdown(getRemainingMs(endTime)))

    const interval = setInterval(() => {
      setCountdown(toCountdown(getRemainingMs(endTime)))
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [endTime])

  return countdown
}
