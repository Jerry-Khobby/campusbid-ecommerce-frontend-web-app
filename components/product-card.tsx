"use client"

import type React from "react"
import { MapPin, Plus, Heart } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ButtonWithLoader } from "@/components/button-with-loader"
import { OptimizedImage } from "@/components/optimized-image"
import type { MarketplaceItem } from "@/lib/product-filters"

interface ProductCardProps {
  item: MarketplaceItem
  isSaved: boolean
  onSelect: (item: MarketplaceItem) => void
  onAddToCart: (item: MarketplaceItem) => void
  onToggleSave: (item: MarketplaceItem) => void
}

export function ProductCard({ item, isSaved, onSelect, onAddToCart, onToggleSave }: ProductCardProps) {
  const stopPropagationThen = (handler: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation()
    handler()
  }

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
      onClick={() => onSelect(item)}
    >
      <div className="aspect-square bg-muted overflow-hidden">
        <OptimizedImage src={item.image} alt={item.name} className="w-full h-full" />
      </div>
      <div className="p-2 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{item.category}</p>
          <h3 className="font-semibold text-xs text-foreground line-clamp-2 mb-1">{item.name}</h3>
          <p className="text-xs text-muted-foreground mb-1 line-clamp-1">{item.vendor}</p>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-accent text-sm">${item.price.toFixed(2)}</span>
          <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
            <MapPin size={10} />
            {item.distance}km
          </div>
        </div>
        <div className="flex gap-1">
          <ButtonWithLoader
            onClick={stopPropagationThen(() => onAddToCart(item))}
            className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-1 text-xs flex items-center justify-center gap-1"
            loadingDuration={1000}
          >
            <Plus size={12} />
            Add
          </ButtonWithLoader>
          <Button
            onClick={stopPropagationThen(() => onToggleSave(item))}
            className={`px-2 py-1 text-xs font-semibold flex items-center justify-center ${
              isSaved ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Heart size={12} fill={isSaved ? "currentColor" : "none"} />
          </Button>
        </div>
      </div>
    </Card>
  )
}
