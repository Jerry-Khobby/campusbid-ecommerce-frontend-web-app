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

  // The image/name/price area is the link to the product, as its own button,
  // so the Add and Save buttons below aren't nested inside another control.
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
      <button
        type="button"
        onClick={() => onSelect(product)}
        className="flex-1 flex flex-col text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-accent"
      >
        <div className="relative aspect-square w-full bg-muted overflow-hidden">
          <OptimizedImage src={product.images[0] ?? "/placeholder.svg"} alt="" className="w-full h-full" />
          {!product.isAvailable && (
            <span className="absolute top-2 left-2 rounded bg-background/90 px-2 py-0.5 text-xs font-semibold text-foreground">
              Unavailable
            </span>
          )}
        </div>
        <div className="p-2 pb-0 w-full">
          <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
          <h3 className="font-semibold text-xs text-foreground line-clamp-2 mb-1">{product.name}</h3>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-accent text-sm">{formatCurrency(displayPrice)}</span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                <span className="sr-only">was </span>
                {formatCurrency(product.price)}
              </span>
            )}
          </div>
        </div>
      </button>
      <div className="flex gap-1 px-2 pb-2">
        <ButtonWithLoader
          onClick={handleAddToCart}
          disabled={!product.isAvailable}
          className="flex-1 min-h-9 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-1 text-xs flex items-center justify-center gap-1"
          loadingDuration={1000}
        >
          {product.isAvailable ? (
            <>
              <Plus size={12} aria-hidden="true" />
              Add
              <span className="sr-only"> {product.name} to cart</span>
            </>
          ) : (
            "Unavailable"
          )}
        </ButtonWithLoader>
        <Button
          onClick={handleToggleSave}
          aria-label={isSaved ? `Remove ${product.name} from saved items` : `Save ${product.name}`}
          aria-pressed={isSaved}
          className={`min-h-9 min-w-9 px-2 py-1 text-xs font-semibold flex items-center justify-center ${
            isSaved ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <Heart size={14} fill={isSaved ? "currentColor" : "none"} aria-hidden="true" />
        </Button>
      </div>
    </Card>
  )
}
