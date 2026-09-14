"use client"

import { Button } from "@/components/ui/button"

interface PaginationControlsProps {
  page: number
  totalPages: number
  onChangePage: (page: number) => void
}

/** Simple previous/next pager for a server-paginated list. */
export function PaginationControls({ page, totalPages, onChangePage }: PaginationControlsProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-4 mt-6">
      <Button variant="outline" disabled={page <= 1} onClick={() => onChangePage(page - 1)}>
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button variant="outline" disabled={page >= totalPages} onClick={() => onChangePage(page + 1)}>
        Next
      </Button>
    </div>
  )
}
