import type { ReactNode } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Search" }

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
