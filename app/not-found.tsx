import type { Metadata } from "next"
import Link from "next/link"
import { SearchX } from "lucide-react"

export const metadata: Metadata = { title: "Page not found" }

export default function NotFound() {
  return (
    <main className="w-full max-w-md mx-auto px-4 py-16 flex flex-col items-center text-center gap-4">
      <SearchX size={48} className="text-muted-foreground" aria-hidden="true" />
      <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
      <p className="text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Link
          href="/home"
          className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 font-semibold text-accent-foreground hover:bg-accent/90"
        >
          Back to shop
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 font-semibold text-foreground hover:bg-muted"
        >
          Search items
        </Link>
      </div>
    </main>
  )
}
