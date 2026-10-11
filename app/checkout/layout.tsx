import type { ReactNode } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Checkout" }

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
