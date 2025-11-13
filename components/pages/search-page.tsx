"use client"

import { useState } from "react"
import { Search, MapPin, Plus, Heart, Filter } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { useUser } from "@/lib/user-context"
import { useNotification } from "@/lib/notification-context"
import { mockItems } from "@/lib/mock-data"
import { ButtonWithLoader } from "@/components/button-with-loader"
import { OptimizedImage } from "@/components/optimized-image"

export default function SearchPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"price-low" | "price-high" | "distance">("distance")
  const { addItem } = useCart()
  const { user, toggleSaveItem } = useUser()
  const { addNotification } = useNotification()

  const categories = Array.from(new Set(mockItems.map((item) => item.category)))

  let filteredItems = mockItems.filter(
    (item) =>
      (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!selectedCategory || item.category === selectedCategory),
  )

  if (sortBy === "price-low") {
    filteredItems = [...filteredItems].sort((a, b) => a.price - b.price)
  } else if (sortBy === "price-high") {
    filteredItems = [...filteredItems].sort((a, b) => b.price - a.price)
  } else if (sortBy === "distance") {
    filteredItems = [...filteredItems].sort((a, b) => a.distance - b.distance)
  }

  const handleAddToCart = (item: (typeof mockItems)[0]) => {
    addItem({
      id: item.id,
      name: item.name,
      vendor: item.vendor,
      price: item.price,
      image: item.image,
    })
    addNotification(`${item.name} added to cart`, "success")
  }

  const handleSaveItem = (item: (typeof mockItems)[0]) => {
    if (!user) {
      addNotification("Please log in to save items", "info")
      router.push("/login")
      return
    }
    toggleSaveItem(item.id)
    const isSaved = user.savedItems.includes(item.id)
    addNotification(isSaved ? "Item removed from saved" : "Item saved", "info")
  }

  const handleViewProduct = (itemId: number) => {
    router.push(`/product/${itemId}`)
  }

  return (
    <main className="w-full max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-4">Search</h1>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            type="text"
            placeholder="Search items, vendors, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-6 text-base"
            autoFocus
          />
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Category:</span>
        </div>
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === null
              ? "bg-accent text-accent-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-1 rounded-lg bg-muted text-foreground text-sm font-medium border border-border"
          >
            <option value="distance">Nearest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div>
        {filteredItems.length > 0 ? (
          <div>
            <p className="text-sm text-muted-foreground mb-4">{filteredItems.length} items found</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
                  onClick={() => handleViewProduct(item.id)}
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
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddToCart(item)
                        }}
                        className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-1 text-xs flex items-center justify-center gap-1"
                        loadingDuration={1000}
                      >
                        <Plus size={12} />
                        Add
                      </ButtonWithLoader>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSaveItem(item)
                        }}
                        className={`px-2 py-1 text-xs font-semibold flex items-center justify-center ${
                          user?.savedItems.includes(item.id)
                            ? "bg-red-100 text-red-600 hover:bg-red-200"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        <Heart size={12} fill={user?.savedItems.includes(item.id) ? "currentColor" : "none"} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </main>
  )
}
