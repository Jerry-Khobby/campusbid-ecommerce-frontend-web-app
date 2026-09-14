"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { useCart } from "@/lib/cart-context"
import { useUser } from "@/lib/user-context"
import { useNotification } from "@/lib/notification-context"
import { useRequireLoginAction } from "@/hooks/use-require-login-action"
import { mockItems } from "@/lib/mock-data"
import { getCategories, filterItems, sortItems, type SortOption, type MarketplaceItem } from "@/lib/product-filters"
import { CategorySortBar } from "@/components/category-sort-bar"
import { ProductCard } from "@/components/product-card"

export default function SearchPage() {
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

  const handleViewProduct = (item: MarketplaceItem) => {
    router.push(`/product/${item.id}`)
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

      <CategorySortBar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        sortBy={sortBy}
        onChangeSortBy={setSortBy}
      />

      {/* Results */}
      <div>
        {filteredItems.length > 0 ? (
          <div>
            <p className="text-sm text-muted-foreground mb-4">{filteredItems.length} items found</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {filteredItems.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  isSaved={user?.savedItems.includes(item.id) ?? false}
                  onSelect={handleViewProduct}
                  onAddToCart={handleAddToCart}
                  onToggleSave={handleSaveItem}
                />
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
