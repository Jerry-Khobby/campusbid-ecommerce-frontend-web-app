"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useUser } from "@/lib/user-context"
import { VendorSidebar } from "@/components/vendor/vendor-sidebar"

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!user && pathname !== "/vendor/login") {
      router.push("/vendor/login")
    }
  }, [user, pathname, router])

  // Hide sidebar on login page
  if (pathname === "/vendor/login") {
    return <>{children}</>
  }

  // Show loading state while checking authentication
  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 flex-shrink-0 hidden md:block">
        <VendorSidebar />
      </aside>
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  )
}
