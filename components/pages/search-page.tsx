"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useCart } from "@/lib/cart-context"
import { useUser } from "@/lib/user-context"
import { useNotification } from "@/lib/notification-context"
import { fetchProducts, type Product } from "@/lib/api/products"
import { fetchCategories } from "@/lib/api/categories"
import { search, type VendorSearchResult } from "@/lib/api/search"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { CategorySortBar } from "@/components/category-sort-bar"
import { ProductCard } from "@/components/product-card"
import { ProductCardSkeleton } from "@/components/skeleton-loader"
import { QueryErrorState, getApiErrorMessage } from "@/components/query-error-state"
import { PaginationControls } from "@/components/pagination-controls"
import { OptimizedImage } from "@/components/optimized-image"

const SEARCH_DEBOUNCE_MS = 300
const PRODUCTS_PAGE_SIZE = 12
const SKELETON_CARD_COUNT = 10

export default function SearchPage() {
  const router = useRouter()
  const { addItem } = useCart()
  const { savedItemIds, toggleSavedItem } = useUser()
  const { addNotification } = useNotification()

  const [searchInput, setSearchInput] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [vendorFilter, setVendorFilter] = useState<{ id: string; name: string } | null>(null)
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS)
  const isSearching = debouncedSearch.length > 0

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, selectedCategory, vendorFilter])

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: fetchCategories })

  // Free-text search: hits the ranked full-text GET /search endpoint, which
  // returns both matching products and vendors but isn't paginated server-side.
  const searchQuery = useQuery({
    queryKey: ["search", { q: debouncedSearch, category: selectedCategory }],
    queryFn: () => search(debouncedSearch, selectedCategory ?? undefined),
    enabled: isSearching,
  })

  // Browse mode (no search text): the regular paginated product list,
  // optionally narrowed to a vendor picked from search results.
  const productsQuery = useQuery({
    queryKey: ["products", { category: selectedCategory, vendorId: vendorFilter?.id, page, limit: PRODUCTS_PAGE_SIZE }],
    queryFn: () =>
      fetchProducts({
        category: selectedCategory ?? undefined,
        vendorId: vendorFilter?.id,
        page,
        limit: PRODUCTS_PAGE_SIZE,
      }),
    enabled: !isSearching,
  })

  useEffect(() => {
    if (productsQuery.error) addNotification(getApiErrorMessage(productsQuery.error), "error")
  }, [productsQuery.error, addNotification])

  useEffect(() => {
    if (searchQuery.error) addNotification(getApiErrorMessage(searchQuery.error), "error")
  }, [searchQuery.error, addNotification])

  useEffect(() => {
    if (categoriesQuery.error) addNotification(getApiErrorMessage(categoriesQuery.error), "error")
  }, [categoriesQuery.error, addNotification])

  const handleSelectVendor = (vendor: VendorSearchResult) => {
    setVendorFilter({ id: vendor._id, name: vendor.profile.businessName })
    setSearchInput("")
  }

  const handleSelectProduct = (product: Product) => {
    router.push(`/product/${product._id}`)
  }

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product._id,
      vendorId: product.vendorId,
      name: product.name,
      vendor: product.vendorName ?? "Vendor",
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

  const browseProducts = productsQuery.data?.items ?? []
  const totalPages = productsQuery.data ? Math.ceil(productsQuery.data.total / PRODUCTS_PAGE_SIZE) : 1

  const searchProducts = searchQuery.data?.products ?? []
  const searchVendors = searchQuery.data?.vendors ?? []

  const isLoading = isSearching ? searchQuery.isLoading : productsQuery.isLoading
  const isError = isSearching ? searchQuery.isError : productsQuery.isError
  const error = isSearching ? searchQuery.error : productsQuery.error
  const refetch = () => (isSearching ? searchQuery.refetch() : productsQuery.refetch())
  const products = isSearching ? searchProducts : browseProducts
  const hasResults = isSearching ? searchProducts.length > 0 || searchVendors.length > 0 : browseProducts.length > 0

  return (
    <main className="w-full max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-4">Search</h1>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            type="text"
            placeholder="Search items, vendors, categories..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 py-6 text-base"
            autoFocus
          />
        </div>
      </div>

      <CategorySortBar
        categories={categoriesQuery.data ?? []}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {vendorFilter && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Showing items from</span>
          <span className="px-3 py-1 rounded-full bg-accent text-accent-foreground font-medium">
            {vendorFilter.name}
          </span>
          <button onClick={() => setVendorFilter(null)} className="text-muted-foreground hover:text-foreground underline">
            Clear
          </button>
        </div>
      )}

      <div>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : isError ? (
          <QueryErrorState message={getApiErrorMessage(error)} onRetry={refetch} />
        ) : hasResults ? (
          <div>
            {isSearching && searchVendors.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-foreground mb-2">Vendors</h2>
                <div className="flex flex-wrap gap-3">
                  {searchVendors.map((vendor) => (
                    <button
                      key={vendor._id}
                      onClick={() => handleSelectVendor(vendor)}
                      className="flex items-center gap-2 pr-4 pl-2 py-2 rounded-full border border-border hover:bg-muted transition-colors"
                    >
                      <OptimizedImage
                        src={vendor.profile.logo ?? "/placeholder.svg"}
                        alt={vendor.profile.businessName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium text-foreground">{vendor.profile.businessName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(!isSearching || searchProducts.length > 0) && (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  {isSearching ? searchProducts.length : productsQuery.data?.total} items found
                </p>
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
                {!isSearching && <PaginationControls page={page} totalPages={totalPages} onChangePage={setPage} />}
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchInput ? `No items found matching "${searchInput}"` : "No items found."}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
