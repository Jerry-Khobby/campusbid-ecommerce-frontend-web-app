"use client"

import type React from "react"

import { usePathname } from "next/navigation"

export default function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"

  return <div className={`flex-1 overflow-y-auto ${isLoginPage ? "" : "pb-24 md:pb-28"}`}>{children}</div>
}
