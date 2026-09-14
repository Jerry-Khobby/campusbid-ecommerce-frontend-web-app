"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Search, Flame } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useCart } from "@/lib/cart-context"
import { useUser } from "@/lib/user-context"
import { useNotification } from "@/lib/notification-context"
import { fetchProducts, type Product } from "@/lib/api/products"
import { fetchCategories } from "@/lib/api/categories"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { CategorySortBar } from "@/components/category-sort-bar"
import { ProductCard } from "@/components/product-card"
import { ProductCardSkeleton } from "@/components/skeleton-loader"
import { QueryErrorState, getApiErrorMessage } from "@/components/query-error-state"
import { PaginationControls } from "@/components/pagination-controls"

const SEARCH_DEBOUNCE_MS = 300
const PRODUCTS_PAGE_SIZE = 12
const SKELETON_CARD_COUNT = 10

export default function HomePage() {
  const router = useRouter()
  const { addItem } = useCart()
  const { savedItemIds, toggleSavedItem } = useUser()
  const { addNotification } = useNotification()

  const [searchInput, setSearchInput] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, selectedCategory])

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: fetchCategories })

  const productsQuery = useQuery({
    queryKey: ["products", { search: debouncedSearch, category: selectedCategory, page, limit: PRODUCTS_PAGE_SIZE }],
    queryFn: () =>
      fetchProducts({
        search: debouncedSearch || undefined,
        category: selectedCategory ?? undefined,
        page,
        limit: PRODUCTS_PAGE_SIZE,
      }),
  })

  useEffect(() => {
    if (productsQuery.error) addNotification(getApiErrorMessage(productsQuery.error), "error")
  }, [productsQuery.error, addNotification])

  useEffect(() => {
    if (categoriesQuery.error) addNotification(getApiErrorMessage(categoriesQuery.error), "error")
  }, [categoriesQuery.error, addNotification])

  const handleSelectProduct = (product: Product) => {
    router.push(`/product/${product._id}`)
  }

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product._id,
      vendorId: product.vendorId,
      name: product.name,
      vendor: product.vendorId,
      price: product.discountPrice ?? product.price,
      image: product.images[0] ?? "/placeholder.svg",
    })
    addNotification(`${product.name} added to cart`, "success")
  }

  const handleToggleSave = (product: Product) => {
    const wasSaved = savedItemIds.includes(product._id)
    toggleSavedItem(product._id)
    addNotification(wasSaved ? "Item removed from saved" : "Item saved", "info")
  }

  const products = productsQuery.data?.items ?? []
  const totalPages = productsQuery.data ? Math.ceil(productsQuery.data.total / PRODUCTS_PAGE_SIZE) : 1

  return (
    <main className="w-full max-w-6xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">CampusBid</h1>
        <p className="text-muted-foreground">Buy from campus vendors near you</p>
      </div>

      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            type="text"
            placeholder="Search items, vendors..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 py-6 text-base"
          />
        </div>
      </div>

      <CategorySortBar
        categories={categoriesQuery.data ?? []}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

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

      <div className="mb-4">
        <h2 className="text-xl font-bold text-foreground mb-4">
          Popular Items Near You{productsQuery.data ? ` (${productsQuery.data.total})` : ""}
        </h2>

        {productsQuery.isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : productsQuery.isError ? (
          <QueryErrorState
            message={getApiErrorMessage(productsQuery.error)}
            onRetry={() => productsQuery.refetch()}
          />
        ) : products.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No items found.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onSelect={handleSelectProduct}
                  onAddToCart={handleAddToCart}
                  isSaved={savedItemIds.includes(product._id)}
                  onToggleSave={handleToggleSave}
                />
              ))}
            </div>
            <PaginationControls page={page} totalPages={totalPages} onChangePage={setPage} />
          </>
        )}
      </div>
    </main>
  )
}
