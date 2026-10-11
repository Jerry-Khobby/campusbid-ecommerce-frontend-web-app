"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Search, Flame, Store } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useAddToCart } from "@/hooks/use-add-to-cart"
import { useUser } from "@/lib/user-context"
import { useNotification } from "@/lib/notification-context"
import { fetchProducts, type Product } from "@/lib/api/products"
import { fetchCategories } from "@/lib/api/categories"
import { activeFlashSalesQueryKey, fetchActiveFlashSales } from "@/lib/api/flash-sales"
import { pluralize } from "@/lib/format"
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
  const addToCart = useAddToCart()
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
  // Shares the flash-sales page's cache key, so opening that page is instant.
  const flashSalesQuery = useQuery({ queryKey: activeFlashSalesQueryKey, queryFn: fetchActiveFlashSales })

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

  const handleAddToCart = (product: Product) => addToCart(product)

  const handleToggleSave = (product: Product) => {
    const wasSaved = savedItemIds.includes(product._id)
    toggleSavedItem(product._id)
    addNotification(wasSaved ? "Item removed from saved" : "Item saved", "info")
  }

  const products = productsQuery.data?.items ?? []
  const totalPages = productsQuery.data ? Math.ceil(productsQuery.data.total / PRODUCTS_PAGE_SIZE) : 1
  const activeSaleCount = flashSalesQuery.data?.length
  const flashSalesSubtitle =
    activeSaleCount === undefined
      ? "Bid on time-limited deals"
      : activeSaleCount === 0
        ? "No live sales right now"
        : `${pluralize(activeSaleCount, "sale")} live now`
  const listHeading = debouncedSearch
    ? `Results for "${debouncedSearch}"`
    : selectedCategory
      ? selectedCategory
      : "All Items"

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
            type="search"
            aria-label="Search items"
            placeholder="Search items..."
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
        <Link href="/search" className="rounded-xl focus-visible:outline-2 focus-visible:outline-accent">
          <Card className="h-full p-6 bg-card hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Store size={20} className="text-foreground" aria-hidden="true" />
              <h3 className="font-semibold text-foreground">Browse Marketplace</h3>
            </div>
            <p className="text-sm text-muted-foreground">Search items and vendors</p>
          </Card>
        </Link>
        <Link href="/flash-sales" className="rounded-xl focus-visible:outline-2 focus-visible:outline-accent">
          <Card className="h-full p-6 bg-accent hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Flame size={20} className="text-accent-foreground" aria-hidden="true" />
              <h3 className="font-semibold text-accent-foreground">Flash Sales</h3>
            </div>
            <p className="text-sm text-accent-foreground/80">{flashSalesSubtitle}</p>
          </Card>
        </Link>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-bold text-foreground mb-4">
          {listHeading}
          {productsQuery.data ? ` (${productsQuery.data.total})` : ""}
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
          <p className="text-muted-foreground text-center py-12">
            {debouncedSearch ? `No items match "${debouncedSearch}".` : "No items found."}
          </p>
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
