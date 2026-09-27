"use client"

import { useState } from "react"
import { Flame, Clock, Plus, X, Loader2 } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/format"
import { useNotification } from "@/lib/notification-context"
import { useUser } from "@/lib/user-context"
import { useRequireLoginAction } from "@/hooks/use-require-login-action"
import { useCountdown } from "@/hooks/use-countdown"
import { ButtonWithLoader } from "@/components/button-with-loader"
import { OptimizedImage } from "@/components/optimized-image"
import { ApiError } from "@/lib/api/client"
import {
  activeFlashSalesQueryKey,
  fetchActiveFlashSales,
  fetchMyBids,
  flashSaleQueryKey,
  getMinimumBidAmount,
  myBidsQueryKey,
  placeBid,
  type FlashSale,
  type FlashSaleBidEntry,
  type FlashSaleWithBidStatus,
} from "@/lib/api/flash-sales"

type SalesTab = "active" | "my-bids"

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return "Something went wrong. Please try again."
}

function getVendorName(flashSale: FlashSale): string {
  return flashSale.vendorId.profile?.businessName || "Campus Vendor"
}

function getProductImage(flashSale: FlashSale): string {
  return flashSale.productId.images?.[0] ?? "/placeholder.svg"
}

function getHighestBid(flashSale: FlashSale): number {
  return flashSale.currentBid ?? flashSale.startingBid
}

interface FlashSaleCardProps {
  flashSale: FlashSale
  onBid: (flashSale: FlashSale) => void
}

function FlashSaleCard({ flashSale, onBid }: FlashSaleCardProps) {
  const countdown = useCountdown(flashSale.endTime)

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
      <div className="aspect-square bg-muted overflow-hidden">
        <OptimizedImage src={getProductImage(flashSale)} alt={flashSale.productId.name} className="w-full h-full" />
      </div>

      <div className="p-2 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-xs text-foreground mb-1 line-clamp-2">{flashSale.productId.name}</h3>
          <p className="text-xs text-muted-foreground mb-1">{getVendorName(flashSale)}</p>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs line-through text-muted-foreground">{formatCurrency(flashSale.originalPrice)}</span>
            <span className="text-sm font-bold text-accent">{formatCurrency(getHighestBid(flashSale))}</span>
          </div>
          <p className="text-xs text-muted-foreground">{flashSale.bids.length} bids</p>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-accent mb-2">
          <Clock size={10} />
          {countdown.isExpired ? "Ending..." : countdown.label}
        </div>

        <ButtonWithLoader
          onClick={() => onBid(flashSale)}
          disabled={countdown.isExpired}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold flex items-center justify-center gap-1 py-1 text-xs"
          loadingDuration={1000}
        >
          <Plus size={12} />
          Bid
        </ButtonWithLoader>
      </div>
    </Card>
  )
}

const BID_STATUS_LABEL: Record<FlashSaleWithBidStatus["bidStatus"], string> = {
  active: "Active",
  won: "Won",
  lost: "Lost",
}

const BID_STATUS_CLASS: Record<FlashSaleWithBidStatus["bidStatus"], string> = {
  active: "bg-accent/10 text-accent",
  won: "bg-green-100 text-green-700",
  lost: "bg-muted text-muted-foreground",
}

function getMyBidAmount(flashSale: FlashSaleWithBidStatus, userId: string): number {
  const myBidAmounts = flashSale.bids.filter((bid) => bid.userId === userId).map((bid) => bid.amount)
  return myBidAmounts.length > 0 ? Math.max(...myBidAmounts) : 0
}

interface MyBidRowProps {
  flashSale: FlashSaleWithBidStatus
  userId: string
}

function MyBidRow({ flashSale, userId }: MyBidRowProps) {
  const countdown = useCountdown(flashSale.endTime)

  return (
    <Card className="p-3 flex-row items-center gap-3">
      <div className="w-14 h-14 rounded overflow-hidden flex-shrink-0">
        <OptimizedImage src={getProductImage(flashSale)} alt={flashSale.productId.name} className="w-full h-full" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-foreground truncate">{flashSale.productId.name}</h3>
        <p className="text-xs text-muted-foreground">{getVendorName(flashSale)}</p>
        <p className="text-xs text-muted-foreground">
          Your bid: {formatCurrency(getMyBidAmount(flashSale, userId))} · Highest: {formatCurrency(getHighestBid(flashSale))}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BID_STATUS_CLASS[flashSale.bidStatus]}`}>
          {BID_STATUS_LABEL[flashSale.bidStatus]}
        </span>
        {flashSale.status === "active" && (
          <span className="text-xs text-muted-foreground">
            {countdown.isExpired ? "Ending..." : countdown.label}
          </span>
        )}
      </div>
    </Card>
  )
}

function formatBidTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function getBidderLabel(bid: FlashSaleBidEntry, currentUserId?: string): string {
  if (bid.userId === currentUserId) return "You"
  return `Bidder #${bid.userId.slice(-4)}`
}

interface BidModalProps {
  flashSale: FlashSale
  bidAmount: string
  isSubmitting: boolean
  currentUserId?: string
  onChangeBidAmount: (value: string) => void
  onClose: () => void
  onSubmit: () => void
}

function BidModal({
  flashSale,
  bidAmount,
  isSubmitting,
  currentUserId,
  onChangeBidAmount,
  onClose,
  onSubmit,
}: BidModalProps) {
  const minimumBid = getMinimumBidAmount(flashSale)
  const mostRecentBidsFirst = [...flashSale.bids].reverse()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Place Your Bid</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </div>

          <div className="mb-6 pb-6 border-b">
            <div className="flex gap-4 mb-4">
              <OptimizedImage
                src={getProductImage(flashSale)}
                alt={flashSale.productId.name}
                className="w-20 h-20 rounded flex-shrink-0"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">{flashSale.productId.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{getVendorName(flashSale)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Original Price:</span>
              <span className="line-through text-muted-foreground">{formatCurrency(flashSale.originalPrice)}</span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-foreground mb-2">Your Bid Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground">₵</span>
              <Input
                type="number"
                value={bidAmount}
                onChange={(e) => onChangeBidAmount(e.target.value)}
                placeholder="Enter bid amount"
                className="pl-8 py-2"
                step="0.01"
                min={minimumBid}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Current highest bid: {formatCurrency(getHighestBid(flashSale))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Minimum bid: {formatCurrency(minimumBid)}</p>
          </div>

          <div className="mb-6 pb-6 border-b">
            <h3 className="font-semibold text-foreground mb-3 text-sm">All Bids ({flashSale.bids.length})</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {mostRecentBidsFirst.length === 0 && (
                <p className="text-xs text-muted-foreground">No bids yet — be the first!</p>
              )}
              {mostRecentBidsFirst.map((bid) => (
                <div key={`${bid.userId}-${bid.timestamp}`} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-foreground">{getBidderLabel(bid, currentUserId)}</p>
                    <p className="text-xs text-muted-foreground">{formatBidTime(bid.timestamp)}</p>
                  </div>
                  <span className="font-bold text-accent">{formatCurrency(bid.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                "Place Bid"
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function FlashSalesPage() {
  const [activeTab, setActiveTab] = useState<SalesTab>("active")
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)
  const [bidAmount, setBidAmount] = useState("")

  const { addNotification } = useNotification()
  const { user, isLoggedIn } = useUser()
  const requireLogin = useRequireLoginAction()
  const queryClient = useQueryClient()

  const canViewMyBids = isLoggedIn && user?.role === "student"

  const {
    data: sales = [],
    isLoading: isSalesLoading,
    isError: isSalesError,
  } = useQuery({ queryKey: activeFlashSalesQueryKey, queryFn: fetchActiveFlashSales })

  const {
    data: myBids = [],
    isLoading: isMyBidsLoading,
    isError: isMyBidsError,
  } = useQuery({
    queryKey: myBidsQueryKey(),
    queryFn: () => fetchMyBids(),
    enabled: activeTab === "my-bids" && canViewMyBids,
  })

  const bidMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => placeBid(id, amount),
    onSuccess: (updatedSale) => {
      queryClient.setQueryData<FlashSale[]>(activeFlashSalesQueryKey, (previous) =>
        previous?.map((sale) => (sale._id === updatedSale._id ? updatedSale : sale)) ?? previous,
      )
      queryClient.invalidateQueries({ queryKey: flashSaleQueryKey(updatedSale._id) })
      addNotification(`Bid of ${formatCurrency(updatedSale.currentBid ?? 0)} placed successfully!`, "success")
      setBidAmount(getMinimumBidAmount(updatedSale).toString())
    },
    onError: (error) => {
      addNotification(getErrorMessage(error), "error")
    },
  })

  const selectedSale = sales.find((sale) => sale._id === selectedSaleId) ?? null

  const handleOpenBidModal = (flashSale: FlashSale) => {
    requireLogin("Please log in to place a bid", () => {
      setSelectedSaleId(flashSale._id)
      setBidAmount(getMinimumBidAmount(flashSale).toString())
    })
  }

  const handleCloseBidModal = () => {
    setSelectedSaleId(null)
    setBidAmount("")
  }

  const handlePlaceBid = () => {
    if (!selectedSale) return

    const amount = Number.parseFloat(bidAmount)
    const minimumBid = getMinimumBidAmount(selectedSale)

    if (!Number.isFinite(amount) || amount < minimumBid) {
      addNotification(`Bid must be at least ${formatCurrency(minimumBid)}`, "error")
      return
    }

    bidMutation.mutate({ id: selectedSale._id, amount })
  }

  return (
    <main className="w-full max-w-6xl mx-auto px-4 py-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="text-accent" size={28} />
          <h1 className="text-3xl font-bold text-foreground">Flash Sales</h1>
        </div>
        <p className="text-muted-foreground">Ending soon - bid now!</p>

        {canViewMyBids && (
          <div className="flex gap-2 mt-4">
            <Button
              variant={activeTab === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("active")}
            >
              Active Sales
            </Button>
            <Button
              variant={activeTab === "my-bids" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("my-bids")}
            >
              My Bids
            </Button>
          </div>
        )}
      </div>

      {activeTab === "active" && (
        <>
          {isSalesLoading && (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="animate-spin" size={24} />
            </div>
          )}

          {isSalesError && (
            <p className="text-center text-muted-foreground py-12">
              Couldn't load flash sales right now. Please try again later.
            </p>
          )}

          {!isSalesLoading && !isSalesError && sales.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No active flash sales right now.</p>
          )}

          {!isSalesLoading && !isSalesError && sales.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {sales.map((flashSale) => (
                <FlashSaleCard key={flashSale._id} flashSale={flashSale} onBid={handleOpenBidModal} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "my-bids" && canViewMyBids && (
        <>
          {isMyBidsLoading && (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="animate-spin" size={24} />
            </div>
          )}

          {isMyBidsError && (
            <p className="text-center text-muted-foreground py-12">Couldn't load your bids right now.</p>
          )}

          {!isMyBidsLoading && !isMyBidsError && myBids.length === 0 && (
            <p className="text-center text-muted-foreground py-12">You haven't placed any bids yet.</p>
          )}

          {!isMyBidsLoading && !isMyBidsError && myBids.length > 0 && user && (
            <div className="space-y-2">
              {myBids.map((flashSale) => (
                <MyBidRow key={flashSale._id} flashSale={flashSale} userId={user._id} />
              ))}
            </div>
          )}
        </>
      )}

      {selectedSale && (
        <BidModal
          flashSale={selectedSale}
          bidAmount={bidAmount}
          isSubmitting={bidMutation.isPending}
          currentUserId={user?._id}
          onChangeBidAmount={setBidAmount}
          onClose={handleCloseBidModal}
          onSubmit={handlePlaceBid}
        />
      )}
    </main>
  )
}
