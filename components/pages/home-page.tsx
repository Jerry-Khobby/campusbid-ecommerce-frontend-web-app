"use client"

import { useState } from "react"
import { Search, MapPin, Flame, Plus, Heart, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { useUser } from "@/lib/user-context"
import { useNotification } from "@/lib/notification-context"
import { mockItems } from "@/lib/mock-data"
import { ButtonWithLoader } from "@/components/button-with-loader"
import { OptimizedImage } from "@/components/optimized-image"
import { useRouter } from "next/navigation"

interface HomePageProps {
  onAddToCart: () => void
  onViewProduct?: (itemId: number) => void
}

export default function HomePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"price-low" | "price-high" | "distance">("distance")
  const [isLoading, setIsLoading] = useState(false)
  const { addItem } = useCart()
  const { user, toggleSaveItem } = useUser()
  const { addNotification } = useNotification()

  const categories = Array.from(new Set(mockItems.map((item) => item.category)))

  let filteredItems = mockItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vendor.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (sortBy === "price-low") {
    filteredItems = [...filteredItems].sort((a, b) => a.price - b.price)
  } else if (sortBy === "price-high") {
    filteredItems = [...filteredItems].sort((a, b) => b.price - a.price)
  } else if (sortBy === "distance") {
    filteredItems = [...filteredItems].sort((a, b) => a.distance - b.distance)
  }

  const handleAddToCart = (item: (typeof mockItems)[0]) => {
    setIsLoading(true)
    setTimeout(() => {
      addItem({
        id: item.id,
        name: item.name,
        vendor: item.vendor,
        price: item.price,
        image: item.image,
      })
      addNotification(`${item.name} added to cart`, "success")
      setIsLoading(false)
    }, 1000)
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

  return (
    <main className="w-full max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">CampusBid</h1>
        <p className="text-muted-foreground">Buy from campus vendors near you</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            type="text"
            placeholder="Search items, vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-6 text-base"
          />
        </div>
      </div>

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

      {/* CTA Sections */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card className="p-6 bg-card hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="font-semibold text-foreground mb-2">Browse Marketplace</h3>
          <p className="text-sm text-muted-foreground">Explore all items</p>
        </Card>
        <Card
          className="p-6 bg-accent hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => router.push("/flash-sales")}
        >
          <div className="flex items-center gap-2 mb-2">
            <Flame size={20} className="text-accent-foreground" />
            <h3 className="font-semibold text-accent-foreground">Flash Sales</h3>
          </div>
          <p className="text-sm text-accent-foreground/80">Ending soon</p>
        </Card>
      </div>

      {/* Popular Items Section */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-foreground mb-4">Popular Items Near You ({filteredItems.length})</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col relative"
              onClick={() => router.push(`/product/${item.id}`)}
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
    </main>
  )
}
