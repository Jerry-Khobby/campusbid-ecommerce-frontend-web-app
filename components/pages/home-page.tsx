"use client"

import { useState } from "react"
import { Search, Flame } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useCart } from "@/lib/cart-context"
import { useUser } from "@/lib/user-context"
import { useNotification } from "@/lib/notification-context"
import { useRequireLoginAction } from "@/hooks/use-require-login-action"
import { mockItems } from "@/lib/mock-data"
import { getCategories, filterItems, sortItems, type SortOption, type MarketplaceItem } from "@/lib/product-filters"
import { CategorySortBar } from "@/components/category-sort-bar"
import { ProductCard } from "@/components/product-card"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("distance")
  const { addItem } = useCart()
  const { user, toggleSaveItem } = useUser()
  const { addNotification } = useNotification()
  const requireLogin = useRequireLoginAction()

  const categories = getCategories(mockItems)
  const filteredItems = sortItems(filterItems(mockItems, searchQuery, selectedCategory), sortBy)

  const handleAddToCart = (item: MarketplaceItem) => {
    addItem({ id: item.id, name: item.name, vendor: item.vendor, price: item.price, image: item.image })
    addNotification(`${item.name} added to cart`, "success")
  }

  const handleSaveItem = (item: MarketplaceItem) => {
    requireLogin("Please log in to save items", () => {
      toggleSaveItem(item.id)
      const isSaved = user?.savedItems.includes(item.id)
      addNotification(isSaved ? "Item removed from saved" : "Item saved", "info")
    })
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

      <CategorySortBar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        sortBy={sortBy}
        onChangeSortBy={setSortBy}
      />

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
            <ProductCard
              key={item.id}
              item={item}
              isSaved={user?.savedItems.includes(item.id) ?? false}
              onSelect={(selected) => router.push(`/product/${selected.id}`)}
              onAddToCart={handleAddToCart}
              onToggleSave={handleSaveItem}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
