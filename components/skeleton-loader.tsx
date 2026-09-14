"use client"

const CHAT_SKELETON_MESSAGE_COUNT = 5

export function SkeletonLoader() {
  return (
    <div className="overflow-hidden rounded-lg bg-muted animate-pulse">
      <div className="aspect-square bg-muted-foreground/20" />
      <div className="p-2 space-y-2">
        <div className="h-3 bg-muted-foreground/20 rounded w-1/2" />
        <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
        <div className="h-3 bg-muted-foreground/20 rounded w-1/3" />
      </div>
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg bg-muted animate-pulse">
      <div className="aspect-square bg-muted-foreground/20" />
      <div className="p-2 space-y-2">
        <div className="h-3 bg-muted-foreground/20 rounded w-1/2" />
        <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
        <div className="h-3 bg-muted-foreground/20 rounded w-1/3" />
        <div className="h-4 bg-muted-foreground/20 rounded w-1/2 mt-2" />
        <div className="flex gap-1">
          <div className="h-8 bg-muted-foreground/20 rounded flex-1" />
          <div className="h-8 bg-muted-foreground/20 rounded w-10" />
        </div>
      </div>
    </div>
  )
}

export function FlashSaleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg bg-muted animate-pulse">
      <div className="aspect-square bg-muted-foreground/20" />
      <div className="p-2 space-y-2">
        <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
        <div className="h-3 bg-muted-foreground/20 rounded w-1/2" />
        <div className="h-3 bg-muted-foreground/20 rounded w-2/3" />
        <div className="h-4 bg-muted-foreground/20 rounded w-1/3 mt-2" />
        <div className="h-8 bg-muted-foreground/20 rounded w-full" />
      </div>
    </div>
  )
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(CHAT_SKELETON_MESSAGE_COUNT)].map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
          <div className="h-10 bg-muted-foreground/20 rounded-lg w-2/3 animate-pulse" />
        </div>
      ))}
    </div>
  )
}
