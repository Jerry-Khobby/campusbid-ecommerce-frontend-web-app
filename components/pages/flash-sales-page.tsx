"use client"

import { useState, useEffect } from "react"
import { Flame, Clock, Plus, X, MapPin, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNotification } from "@/lib/notification-context"
import { useUser } from "@/lib/user-context"
import { useRouter } from "next/navigation" // Fixed router import to use next/navigation for App Router
import { mockFlashSales } from "@/lib/mock-data"
import { ButtonWithLoader } from "@/components/button-with-loader"

interface FlashItem {
  id: number
  name: string
  vendor: string
  originalPrice: number
  currentBid: number
  image: string
  endsIn: number
  distance: number
  lat: number
  lng: number
  bids: Array<{ bidder: string; amount: number; time: string }>
}

export default function FlashSalesPage() {
  const [items, setItems] = useState<FlashItem[]>(mockFlashSales)
  const [timers, setTimers] = useState<Record<number, string>>({})
  const [selectedItem, setSelectedItem] = useState<FlashItem | null>(null)
  const [bidAmount, setBidAmount] = useState("")
  const [showBidModal, setShowBidModal] = useState(false)
  const [isBidLoading, setIsBidLoading] = useState(false)
  const { addNotification } = useNotification()
  const { isLoggedIn, user } = useUser()
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          endsIn: Math.max(0, item.endsIn - 1),
        })),
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const newTimers: Record<number, string> = {}
    items.forEach((item) => {
      const hours = Math.floor(item.endsIn / 3600)
      const minutes = Math.floor((item.endsIn % 3600) / 60)
      const seconds = item.endsIn % 60
      newTimers[item.id] =
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    })
    setTimers(newTimers)
  }, [items])

  const handleOpenBidModal = (item: FlashItem) => {
    if (!isLoggedIn) {
      addNotification("Please log in to place a bid", "info")
      router.push("/login")
      return
    }
    setSelectedItem(item)
    setBidAmount(item.currentBid.toString())
    setShowBidModal(true)
  }

  const handlePlaceBid = () => {
    if (!selectedItem || !bidAmount || !user) return

    setIsBidLoading(true)
    setTimeout(() => {
      const newBidAmount = Number.parseFloat(bidAmount)

      const updatedItems = items.map((item) => {
        if (item.id === selectedItem.id) {
          return {
            ...item,
            currentBid: newBidAmount,
            bids: [
              ...item.bids,
              {
                bidder: user.name,
                amount: newBidAmount,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ],
          }
        }
        return item
      })

      setItems(updatedItems)
      addNotification(`Bid of $${newBidAmount.toFixed(2)} placed! Waiting for vendor response...`, "success")
      setShowBidModal(false)
      setBidAmount("")
      setSelectedItem(null)
      setIsBidLoading(false)
    }, 1500)
  }

  return (
    <main className="w-full max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="text-accent" size={28} />
          <h1 className="text-3xl font-bold text-foreground">Flash Sales</h1>
        </div>
        <p className="text-muted-foreground">Ending soon - bid now!</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
            {/* Image */}
            <div className="aspect-square bg-muted overflow-hidden">
              <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-full h-full object-cover" />
            </div>

            {/* Content */}
            <div className="p-2 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-xs text-foreground mb-1 line-clamp-2">{item.name}</h3>
                <p className="text-xs text-muted-foreground mb-1">{item.vendor}</p>
                <div className="flex items-center gap-1 mb-1">
                  <MapPin size={10} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{item.distance}km</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs line-through text-muted-foreground">${item.originalPrice.toFixed(2)}</span>
                  <span className="text-sm font-bold text-accent">${item.currentBid.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground">{item.bids.length} bids</p>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-1 text-xs font-semibold text-accent mb-2">
                <Clock size={10} />
                {timers[item.id] || "00:00:00"}
              </div>

              {/* Bid Button */}
              <ButtonWithLoader
                onClick={() => handleOpenBidModal(item)}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold flex items-center justify-center gap-1 py-1 text-xs"
                loadingDuration={1000}
              >
                <Plus size={12} />
                Bid
              </ButtonWithLoader>
            </div>
          </Card>
        ))}
      </div>

      {/* Bid Modal */}
      {showBidModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Place Your Bid</h2>
                <button onClick={() => setShowBidModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>

              {/* Item Info */}
              <div className="mb-6 pb-6 border-b">
                <div className="flex gap-4 mb-4">
                  <img
                    src={selectedItem.image || "/placeholder.svg"}
                    alt={selectedItem.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{selectedItem.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{selectedItem.vendor}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin size={12} />
                      {selectedItem.distance}km away
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Original Price:</span>
                  <span className="line-through text-muted-foreground">${selectedItem.originalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Bid Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-foreground mb-2">Your Bid Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground">$</span>
                  <Input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="Enter bid amount"
                    className="pl-8 py-2"
                    step="0.01"
                    min="0"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Current highest bid: ${selectedItem.currentBid.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You can bid lower than the asking price of ${selectedItem.originalPrice.toFixed(2)}
                </p>
              </div>

              {/* All Bids */}
              <div className="mb-6 pb-6 border-b">
                <h3 className="font-semibold text-foreground mb-3 text-sm">All Bids ({selectedItem.bids.length})</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedItem.bids.map((bid, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-foreground">{bid.bidder}</p>
                        <p className="text-xs text-muted-foreground">{bid.time}</p>
                      </div>
                      <span className="font-bold text-accent">${bid.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button onClick={() => setShowBidModal(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handlePlaceBid}
                  disabled={isBidLoading}
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold flex items-center justify-center gap-2"
                >
                  {isBidLoading ? (
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
      )}
    </main>
  )
}
