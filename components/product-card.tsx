"use client"

import type React from "react"
import { Heart, Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ButtonWithLoader } from "@/components/button-with-loader"
import { formatCurrency } from "@/lib/format"
import { OptimizedImage } from "@/components/optimized-image"
import type { Product } from "@/lib/api/products"

interface ProductCardProps {
  product: Product
  onSelect: (product: Product) => void
  onAddToCart: (product: Product) => void
  isSaved: boolean
  onToggleSave: (product: Product) => void
}

export function ProductCard({ product, onSelect, onAddToCart, isSaved, onToggleSave }: ProductCardProps) {
  const displayPrice = product.discountPrice ?? product.price
  const hasDiscount = product.discountPrice !== undefined && product.discountPrice < product.price

  const handleAddToCart = (event: React.MouseEvent) => {
    event.stopPropagation()
    onAddToCart(product)
  }

  const handleToggleSave = (event: React.MouseEvent) => {
    event.stopPropagation()
    onToggleSave(product)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return
    event.preventDefault()
    onSelect(product)
  }

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
      onClick={() => onSelect(product)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View ${product.name}`}
    >
      <div className="aspect-square bg-muted overflow-hidden">
        <OptimizedImage src={product.images[0] ?? "/placeholder.svg"} alt={product.name} className="w-full h-full" />
      </div>
      <div className="p-2 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
          <h3 className="font-semibold text-xs text-foreground line-clamp-2 mb-1">{product.name}</h3>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold text-accent text-sm">{formatCurrency(displayPrice)}</span>
          {hasDiscount && <span className="text-xs text-muted-foreground line-through">{formatCurrency(product.price)}</span>}
        </div>
        <div className="flex gap-1">
          <ButtonWithLoader
            onClick={handleAddToCart}
            className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-1 text-xs flex items-center justify-center gap-1"
            loadingDuration={1000}
          >
            <Plus size={12} />
            Add
          </ButtonWithLoader>
          <Button
            onClick={handleToggleSave}
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
