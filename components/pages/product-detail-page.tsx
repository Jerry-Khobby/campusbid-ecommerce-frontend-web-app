"use client"

import { ArrowLeft, MapPin, Star, Heart, MessageSquare, Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { useUser } from "@/lib/user-context"
import { useNotification } from "@/lib/notification-context"
import { useRequireLoginAction } from "@/hooks/use-require-login-action"
import { mockItems, mockVendors } from "@/lib/mock-data"
import { OptimizedImage } from "@/components/optimized-image"
import { ButtonWithLoader } from "@/components/button-with-loader"
import { useRouter } from "next/navigation"

interface ProductDetailPageProps {
  itemId: number
}

export default function ProductDetailPage({ itemId }: ProductDetailPageProps) {
  const router = useRouter()
  const item = mockItems.find((i) => i.id === itemId)
  const vendor = mockVendors.find((v) => v.name === item?.vendor)
  const vendorItems = mockItems.filter((i) => i.vendor === item?.vendor && i.id !== itemId)

  const { addItem } = useCart()
  const { user, toggleSaveItem } = useUser()
  const { addNotification } = useNotification()
  const requireLogin = useRequireLoginAction()

  if (!item || !vendor) {
    return (
      <main className="w-full max-w-4xl mx-auto px-4 py-6">
        <p className="text-muted-foreground">Item not found</p>
      </main>
    )
  }

  const handleAddToCart = () => {
    addItem({
      id: item.id,
      name: item.name,
      vendor: item.vendor,
      price: item.price,
      image: item.image,
    })
    addNotification(`${item.name} added to cart`, "success")
  }

  const handleSaveItem = () => {
    requireLogin("Please log in to save items", () => {
      toggleSaveItem(item.id)
      const isSaved = user?.savedItems.includes(item.id)
      addNotification(isSaved ? "Item removed from saved" : "Item saved", "info")
    })
  }

  const handleChatWithVendor = () => {
    requireLogin("Please log in to chat with vendors", () => {
      router.push("/chat")
    })
  }

  const isSaved = user?.savedItems.includes(item.id)

  return (
    <main className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-accent hover:text-accent/80 mb-6 font-semibold"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Product Image */}
        <div className="flex flex-col gap-4">
          <Card className="overflow-hidden aspect-square">
            <OptimizedImage src={item.image} alt={item.name} className="w-full h-full" />
          </Card>
        </div>

        {/* Product Info */}
        <div className="flex flex-col justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-2">{item.category}</p>
            <h1 className="text-3xl font-bold text-foreground mb-4">{item.name}</h1>

            {/* Price */}
            <div className="mb-6">
              <p className="text-4xl font-bold text-accent mb-2">${item.price.toFixed(2)}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={16} />
                {item.distance}km away
              </div>
            </div>

            {/* Vendor Info */}
            <Card className="p-4 mb-6 bg-muted/50">
              <div className="flex items-center gap-4">
                <OptimizedImage src={vendor.image} alt={vendor.name} className="w-16 h-16 rounded-full" />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{vendor.name}</h3>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < Math.floor(vendor.rating) ? "fill-accent text-accent" : "text-muted-foreground"
                          }
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{vendor.rating}</span>
                    <span className="text-xs text-muted-foreground">({vendor.reviews} reviews)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{vendor.description}</p>
                </div>
              </div>
            </Card>

            {/* Description */}
            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-2">About this item</h3>
              <p className="text-sm text-muted-foreground">
                High-quality {item.category.toLowerCase()} product from {vendor.name}. Available for immediate purchase.
                Located {item.distance}km away from your current location.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <ButtonWithLoader
              onClick={handleAddToCart}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-3 flex items-center justify-center gap-2"
              loadingDuration={1000}
            >
              <Plus size={20} />
              Add to Cart
            </ButtonWithLoader>

            <Button
              onClick={handleChatWithVendor}
              className="w-full bg-muted hover:bg-muted/80 text-foreground font-semibold py-3 flex items-center justify-center gap-2"
            >
              <MessageSquare size={20} />
              Chat with Vendor
            </Button>

            <Button
              onClick={handleSaveItem}
              className={`w-full font-semibold py-3 flex items-center justify-center gap-2 ${
                isSaved ? "bg-red-100 hover:bg-red-200 text-red-600" : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
            >
              <Heart size={20} fill={isSaved ? "currentColor" : "none"} />
              {isSaved ? "Saved" : "Save Item"}
            </Button>
          </div>
        </div>
      </div>

      {/* More from this Vendor */}
      {vendorItems.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">More from {vendor.name}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {vendorItems.slice(0, 5).map((vendorItem) => (
              <Card
                key={vendorItem.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/product/${vendorItem.id}`)}
              >
                <div className="aspect-square bg-muted overflow-hidden">
                  <OptimizedImage src={vendorItem.image} alt={vendorItem.name} className="w-full h-full" />
                </div>
                <div className="p-2">
                  <h3 className="font-semibold text-xs text-foreground line-clamp-2 mb-1">{vendorItem.name}</h3>
                  <p className="text-xs text-accent font-bold">${vendorItem.price.toFixed(2)}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
