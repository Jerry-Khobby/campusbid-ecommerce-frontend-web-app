"use client"

import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, MapPin, Star, MessageSquare, Plus, CheckCircle2, Heart } from "lucide-react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/format"
import { useCart } from "@/lib/cart-context"
import { useUser } from "@/lib/user-context"
import { useNotification } from "@/lib/notification-context"
import { useRequireLoginAction } from "@/hooks/use-require-login-action"
import { apiFetch } from "@/lib/api/client"
import { fetchProduct, fetchProducts } from "@/lib/api/products"
import { startConversation } from "@/lib/api/chat"
import { useVendorReviews, type VendorReview } from "@/lib/api/reviews"
import { OptimizedImage } from "@/components/optimized-image"
import { ButtonWithLoader } from "@/components/button-with-loader"
import { QueryErrorState, getApiErrorMessage } from "@/components/query-error-state"

// The public vendor shape returned by GET /vendors/:id (see
// campus-bid-backend-web-app/docs/vendors.md). Not put in lib/api/vendors.ts
// since that file belongs to another part of this rewrite; this page is the
// only place that needs it right now.
interface PublicVendor {
  _id: string
  profile: { businessName: string; logo?: string }
  rating: { average: number; count: number }
  stats: { totalOrders: number }
  isVerified: boolean
  isOpen: boolean
}

async function fetchVendor(vendorId: string): Promise<PublicVendor> {
  const json = await apiFetch<{ vendor: PublicVendor }>(`/vendors/${vendorId}`)
  return json.vendor
}

const VENDOR_PRODUCTS_LIMIT = 6
const MAX_VENDOR_PRODUCTS_SHOWN = 5
const RATING_STAR_COUNT = 5

interface ProductDetailPageProps {
  productId: string
}

export default function ProductDetailPage({ productId }: ProductDetailPageProps) {
  const router = useRouter()
  const { addItem } = useCart()
  const { savedItemIds, toggleSavedItem } = useUser()
  const { addNotification } = useNotification()
  const requireLogin = useRequireLoginAction()

  const productQuery = useQuery({ queryKey: ["product", productId], queryFn: () => fetchProduct(productId) })
  const vendorId = productQuery.data?.vendorId

  const vendorQuery = useQuery({
    queryKey: ["vendor", vendorId],
    queryFn: () => fetchVendor(vendorId as string),
    enabled: Boolean(vendorId),
  })

  const vendorProductsQuery = useQuery({
    queryKey: ["products", { vendorId }],
    queryFn: () => fetchProducts({ vendorId, limit: VENDOR_PRODUCTS_LIMIT }),
    enabled: Boolean(vendorId),
  })

  if (productQuery.isLoading) {
    return <ProductDetailSkeleton />
  }

  if (productQuery.isError || !productQuery.data) {
    return (
      <main className="w-full max-w-4xl mx-auto px-4 py-6">
        <QueryErrorState
          message={productQuery.error ? getApiErrorMessage(productQuery.error) : "Product not found."}
          onRetry={() => productQuery.refetch()}
        />
      </main>
    )
  }

  const product = productQuery.data
  const vendorName = vendorQuery.data?.profile.businessName ?? "Vendor"
  const displayPrice = product.discountPrice ?? product.price
  const vendorProducts = (vendorProductsQuery.data?.items ?? []).filter((item) => item._id !== product._id).slice(0, MAX_VENDOR_PRODUCTS_SHOWN)

  const handleAddToCart = () => {
    addItem({
      id: product._id,
      vendorId: product.vendorId,
      name: product.name,
      vendor: vendorName,
      price: displayPrice,
      image: product.images[0] ?? "/placeholder.svg",
    })
    addNotification(`${product.name} added to cart`, "success")
  }

  const handleChatWithVendor = () => {
    requireLogin("Please log in to chat with vendors", () => {
      startConversation(product.vendorId)
        .then((conversation) => router.push(`/chat?conversation=${conversation._id}`))
        .catch((error) => addNotification(getApiErrorMessage(error), "error"))
    })
  }

  const isSaved = savedItemIds.includes(product._id)
  const handleToggleSave = () => {
    toggleSavedItem(product._id)
    addNotification(isSaved ? "Item removed from saved" : "Item saved", "info")
  }

  return (
    <main className="w-full max-w-4xl mx-auto px-4 py-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-accent hover:text-accent/80 mb-6 font-semibold"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex flex-col gap-4">
          <Card className="overflow-hidden aspect-square">
            <OptimizedImage src={product.images[0] ?? "/placeholder.svg"} alt={product.name} className="w-full h-full" />
          </Card>
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
            <h1 className="text-3xl font-bold text-foreground mb-4">{product.name}</h1>

            <div className="mb-6">
              <div className="flex items-center gap-3">
                <p className="text-4xl font-bold text-accent">{formatCurrency(displayPrice)}</p>
                {product.discountPrice !== undefined && product.discountPrice < product.price && (
                  <p className="text-lg text-muted-foreground line-through">{formatCurrency(product.price)}</p>
                )}
              </div>
              {product.rating.count > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <RatingStars average={product.rating.average} />
                  <span className="text-sm text-muted-foreground">({product.rating.count} reviews)</span>
                </div>
              )}
              {!product.isAvailable && <p className="text-sm text-destructive mt-2">Currently unavailable</p>}
            </div>

            <VendorSummaryCard vendorQuery={vendorQuery} />

            {product.description && (
              <div className="mb-6">
                <h3 className="font-semibold text-foreground mb-2">About this item</h3>
                <p className="text-sm text-muted-foreground">{product.description}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <ButtonWithLoader
              onClick={handleAddToCart}
              disabled={!product.isAvailable}
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
              onClick={handleToggleSave}
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

      {vendorProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">More from {vendorName}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {vendorProducts.map((vendorProduct) => (
              <Card
                key={vendorProduct._id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/product/${vendorProduct._id}`)}
              >
                <div className="aspect-square bg-muted overflow-hidden">
                  <OptimizedImage
                    src={vendorProduct.images[0] ?? "/placeholder.svg"}
                    alt={vendorProduct.name}
                    className="w-full h-full"
                  />
                </div>
                <div className="p-2">
                  <h3 className="font-semibold text-xs text-foreground line-clamp-2 mb-1">{vendorProduct.name}</h3>
                  <p className="text-xs text-accent font-bold">
                    {formatCurrency(vendorProduct.discountPrice ?? vendorProduct.price)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {vendorId && <VendorReviewsSection vendorId={vendorId} />}
    </main>
  )
}

function VendorReviewsSection({ vendorId }: { vendorId: string }) {
  const reviewsQuery = useVendorReviews(vendorId)
  const reviews = reviewsQuery.data?.items ?? []

  if (reviewsQuery.isLoading || reviews.length === 0) return null

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-foreground mb-4">Reviews</h2>
      <div className="space-y-3">
        {reviews.map((review) => (
          <ReviewCard key={review._id} review={review} />
        ))}
      </div>
    </div>
  )
}

function getReviewerName(review: VendorReview): string {
  const name = [review.customerId?.profile?.firstName, review.customerId?.profile?.lastName]
    .filter(Boolean)
    .join(" ")
  return name || "Anonymous"
}

function ReviewCard({ review }: { review: VendorReview }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="font-medium text-sm text-foreground">{getReviewerName(review)}</p>
        <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
      </div>
      <RatingStars average={review.rating} />
      {review.review && <p className="text-sm text-muted-foreground mt-2">{review.review}</p>}
    </Card>
  )
}

function RatingStars({ average }: { average: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: RATING_STAR_COUNT }).map((_, index) => (
        <Star
          key={index}
          size={14}
          className={index < Math.round(average) ? "fill-accent text-accent" : "text-muted-foreground"}
        />
      ))}
    </div>
  )
}

function VendorSummaryCard({ vendorQuery }: { vendorQuery: ReturnType<typeof useQuery<PublicVendor>> }) {
  if (vendorQuery.isLoading) {
    return <Card className="p-4 mb-6 bg-muted/50 animate-pulse h-24" />
  }

  if (vendorQuery.isError || !vendorQuery.data) {
    return (
      <Card className="p-4 mb-6 bg-muted/50">
        <p className="text-sm text-muted-foreground">Vendor details couldn&apos;t be loaded.</p>
      </Card>
    )
  }

  const vendor = vendorQuery.data

  return (
    <Card className="p-4 mb-6 bg-muted/50">
      <div className="flex items-center gap-4">
        <OptimizedImage
          src={vendor.profile.logo ?? "/placeholder.svg"}
          alt={vendor.profile.businessName}
          className="w-16 h-16 rounded-full shrink-0"
        />
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-1">
            <h3 className="font-semibold text-foreground">{vendor.profile.businessName}</h3>
            {vendor.isVerified && <CheckCircle2 size={14} className="text-accent" />}
          </div>
          <div className="flex items-center gap-2 mb-1">
            <RatingStars average={vendor.rating.average} />
            <span className="text-sm font-semibold text-foreground">{vendor.rating.average.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({vendor.rating.count} reviews)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin size={12} />
            {vendor.stats.totalOrders} orders fulfilled
            {vendor.isOpen ? " · Open now" : " · Closed now"}
          </div>
        </div>
      </div>
    </Card>
  )
}

function ProductDetailSkeleton() {
  return (
    <main className="w-full max-w-4xl mx-auto px-4 py-6 animate-pulse">
      <div className="h-6 w-20 bg-muted rounded mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-muted rounded-xl" />
        <div className="flex flex-col gap-4">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-8 w-3/4 bg-muted rounded" />
          <div className="h-10 w-1/3 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
          <div className="h-20 bg-muted rounded" />
        </div>
      </div>
    </main>
  )
}
