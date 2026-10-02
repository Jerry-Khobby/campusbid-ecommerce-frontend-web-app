"use client"

import type React from "react"
import { useState } from "react"
import {
  CheckCircle2,
  Clock,
  Truck,
  Package,
  MapPin,
  AlertCircle,
  XCircle,
  RotateCcw,
  Star,
  KeyRound,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/format"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ApiError } from "@/lib/api/client"
import { useNotification } from "@/lib/notification-context"
import {
  useOrders,
  useCancelOrder,
  useConfirmDelivery,
  useOpenDispute,
  getOrderVendorId,
  getOrderVendorName,
  type Order,
  type OrderStatus,
  type OrderItemRecord,
  type OrderStatusHistoryEntry,
} from "@/lib/api/orders"
import { useCreateReview } from "@/lib/api/reviews"

const ORDER_STATUS_CONFIG: Record<OrderStatus, { icon: React.ReactNode; label: string; cardClassName: string }> = {
  pending: { icon: <Clock size={20} className="text-muted-foreground" />, label: "Pending", cardClassName: "bg-muted" },
  accepted: { icon: <Package size={20} className="text-muted-foreground" />, label: "Accepted", cardClassName: "bg-muted" },
  preparing: { icon: <Clock size={20} className="text-muted-foreground" />, label: "Preparing", cardClassName: "bg-muted" },
  ready: { icon: <Package size={20} className="text-accent" />, label: "Ready", cardClassName: "bg-accent/10" },
  out_for_delivery: { icon: <Truck size={20} className="text-accent" />, label: "Out for Delivery", cardClassName: "bg-accent/10" },
  delivered: { icon: <CheckCircle2 size={20} className="text-green-500" />, label: "Delivered", cardClassName: "bg-green-50" },
  disputed: { icon: <ShieldAlert size={20} className="text-amber-600" />, label: "Under Review", cardClassName: "bg-amber-50" },
  completed: { icon: <CheckCircle2 size={20} className="text-green-600" />, label: "Completed", cardClassName: "bg-green-50" },
  cancelled: { icon: <XCircle size={20} className="text-destructive" />, label: "Cancelled", cardClassName: "bg-destructive/5" },
  refunded: { icon: <RotateCcw size={20} className="text-muted-foreground" />, label: "Refunded", cardClassName: "bg-muted" },
}

// The backend only lets customers cancel before the vendor starts preparing;
// from then until delivery is confirmed the payment is still held in escrow.
const CANCELABLE_STATUSES: OrderStatus[] = ["pending", "accepted"]
const PAYMENT_HELD_STATUSES: OrderStatus[] = ["pending", "accepted", "preparing", "ready", "out_for_delivery"]

// Matches the backend's minimum, so a too-short report is caught before sending.
const DISPUTE_REASON_MIN_LENGTH = 10

// The code only means anything once there's actually a delivery in motion to
// verify - showing it earlier or after it's been used would just be noise.
const DELIVERY_CODE_VISIBLE_STATUSES: OrderStatus[] = ["ready", "out_for_delivery"]

// One line per status telling the customer what is happening and what, if
// anything, they need to do - shown on every card without expanding it.
const CUSTOMER_NEXT_STEPS: Record<OrderStatus, string> = {
  pending: "Waiting for the vendor to accept your order. You can still cancel it.",
  accepted: "The vendor accepted your order and will start preparing it soon. You can still cancel it.",
  preparing: "The vendor is preparing your order.",
  ready: "Your order is ready and will be sent out soon. Keep your delivery code handy.",
  out_for_delivery: "Your order is on its way. Give the vendor your delivery code when it arrives.",
  delivered: "Check your order, then confirm delivery to release the payment - or report a problem.",
  disputed: "We're reviewing the problem you reported. Open the order to see where it stands.",
  completed: "All done. You can rate this order.",
  cancelled: "This order was cancelled.",
  refunded: "Your payment for this order was refunded.",
}

// Finished orders a customer has no more action to take on - safe to let them
// clear from their own list. This never touches the order record itself
// (still exists for the vendor, payment history, disputes, etc.), it only
// hides it from this customer's view going forward.
const CLEARABLE_STATUSES: OrderStatus[] = ["completed", "cancelled", "refunded"]
const DISMISSED_ORDERS_STORAGE_KEY = "campusbid.dismissedOrderIds"

function loadDismissedOrderIds(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = window.localStorage.getItem(DISMISSED_ORDERS_STORAGE_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function saveDismissedOrderIds(ids: Set<string>): void {
  try {
    window.localStorage.setItem(DISMISSED_ORDERS_STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // Best-effort only - a full/blocked localStorage just means the order reappears next visit.
  }
}

function getProductId(item: OrderItemRecord): string {
  if (!item.productId) return ""
  return typeof item.productId === "string" ? item.productId : item.productId._id
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

function OrderTimeline({ history }: { history: OrderStatusHistoryEntry[] }) {
  if (history.length === 0) return null

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground mb-2">Order Timeline</p>
      <div className="space-y-0">
        {history.map((entry, index) => {
          const isLast = index === history.length - 1
          const config = ORDER_STATUS_CONFIG[entry.status]
          return (
            <div key={`${entry.status}-${entry.timestamp}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted shrink-0">
                  {config.icon}
                </div>
                {!isLast && <div className="w-px flex-1 bg-border my-0.5" />}
              </div>
              <div className={isLast ? "pb-0" : "pb-4"}>
                <p className="text-sm font-medium text-foreground">{config.label}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(entry.timestamp)}</p>
                {entry.note && <p className="text-xs text-muted-foreground mt-0.5">{entry.note}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StarRating({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}>
          <Star size={22} className={n <= value ? "fill-accent text-accent" : "text-muted-foreground"} />
        </button>
      ))}
    </div>
  )
}

type ActiveAction = { orderId: string; mode: "cancel" | "confirmDelivery" | "dispute" }

export default function OrdersPage() {
  const { data: orders, isLoading, isError } = useOrders()
  const cancelOrder = useCancelOrder()
  const confirmDelivery = useConfirmDelivery()
  const openDispute = useOpenDispute()
  const createReview = useCreateReview()
  const { addNotification } = useNotification()

  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<ActiveAction | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [confirmRating, setConfirmRating] = useState(0)
  const [confirmReview, setConfirmReview] = useState("")
  const [disputeReason, setDisputeReason] = useState("")
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null)
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(new Set())
  const [dismissedOrderIds, setDismissedOrderIds] = useState<Set<string>>(() => loadDismissedOrderIds())

  const handleClearOrder = (orderId: string) => {
    setDismissedOrderIds((prev) => {
      const next = new Set(prev).add(orderId)
      saveDismissedOrderIds(next)
      return next
    })
    addNotification("Removed from your order list.", "success")
  }

  const visibleOrders = orders?.filter((order) => !dismissedOrderIds.has(order._id))

  const closeAction = () => {
    setActiveAction(null)
    setCancelReason("")
    setConfirmRating(0)
    setConfirmReview("")
    setDisputeReason("")
  }

  const handleCancel = async (order: Order) => {
    if (!cancelReason.trim()) {
      addNotification("Please tell us why you're cancelling.", "error")
      return
    }
    try {
      await cancelOrder.mutateAsync({ id: order._id, cancellationReason: cancelReason.trim() })
      addNotification("Order cancelled.", "success")
      closeAction()
    } catch (error) {
      addNotification(error instanceof ApiError ? error.message : "Could not cancel this order.", "error")
    }
  }

  const handleConfirmDelivery = async (order: Order) => {
    try {
      await confirmDelivery.mutateAsync({
        id: order._id,
        rating: confirmRating > 0 ? confirmRating : undefined,
        review: confirmReview.trim() || undefined,
      })
      addNotification("Delivery confirmed. Payment released to the vendor.", "success")
      closeAction()
    } catch (error) {
      addNotification(error instanceof ApiError ? error.message : "Could not confirm delivery.", "error")
    }
  }

  const handleDispute = async (order: Order) => {
    if (disputeReason.trim().length < DISPUTE_REASON_MIN_LENGTH) {
      addNotification(`Please describe what went wrong (at least ${DISPUTE_REASON_MIN_LENGTH} characters).`, "error")
      return
    }
    try {
      await openDispute.mutateAsync({ id: order._id, reason: disputeReason.trim() })
      addNotification(
        "Thanks for reporting this. The payment is on hold while our team reviews it, and we'll let you know the outcome.",
        "success",
      )
      closeAction()
    } catch (error) {
      addNotification(error instanceof ApiError ? error.message : "Could not submit this dispute.", "error")
    }
  }

  if (isLoading) {
    return (
      <main className="w-full max-w-2xl mx-auto px-4 py-6">
        <p className="text-muted-foreground">Loading your orders...</p>
      </main>
    )
  }

  if (isError) {
    return (
      <main className="w-full max-w-2xl mx-auto px-4 py-6">
        <p className="text-destructive">Could not load your orders. Please try again.</p>
      </main>
    )
  }

  return (
    <main className="w-full max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Your Orders</h1>
        <p className="text-muted-foreground">Track your purchases and confirm deliveries</p>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders?.length === 0 && <p className="text-muted-foreground">You haven&apos;t placed any orders yet.</p>}
        {orders && orders.length > 0 && visibleOrders?.length === 0 && (
          <p className="text-muted-foreground">You&apos;ve cleared all your orders.</p>
        )}

        {visibleOrders?.map((order) => {
          const statusConfig = ORDER_STATUS_CONFIG[order.status]
          const isExpanded = expandedOrder === order._id
          const isActionOnThisOrder = activeAction?.orderId === order._id

          return (
            <Card
              key={order._id}
              className={`p-4 hover:shadow-lg transition-shadow cursor-pointer ${statusConfig.cardClassName}`}
              onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
            >
              {/* Order Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">{order.orderNumber}</p>
                  <h3 className="font-semibold text-foreground">
                    {order.items.map((item) => item.productName).join(", ")}
                  </h3>
                  <p className="text-sm text-muted-foreground">{getOrderVendorName(order)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-accent">{formatCurrency(order.pricing.total)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                </div>
              </div>

              {/* Status and what to do next */}
              <div className="pb-4 border-b border-border space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {statusConfig.icon}
                    <span className="text-sm font-medium text-foreground">{statusConfig.label}</span>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-accent">
                    {isExpanded ? "Hide details" : "Show details"}
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{CUSTOMER_NEXT_STEPS[order.status]}</p>
              </div>

              {/* Delivery code - shown on the card itself, so the customer never
                  has to know to expand it. */}
              {order.deliveryCode && DELIVERY_CODE_VISIBLE_STATUSES.includes(order.status) && (
                <Card className="mt-4 p-4 bg-accent/10 border border-accent/20 flex-row items-center gap-3">
                  <KeyRound size={20} className="text-accent shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-accent">Your delivery code</p>
                    <p className="text-2xl font-bold tracking-widest text-foreground">{order.deliveryCode}</p>
                    <p className="text-xs text-accent/80">
                      Give this to the vendor when your order arrives - don&apos;t share it before then.
                    </p>
                  </div>
                </Card>
              )}

              {/* Expanded Details */}
              {isExpanded && (
                <div className="space-y-4 pt-4" onClick={(e) => e.stopPropagation()}>
                  {/* Items */}
                  <div className="space-y-1">
                    {order.items.map((item, index) => (
                      <div key={getProductId(item) || index} className="flex justify-between text-sm">
                        <span className="text-foreground">
                          {item.productName} x{item.quantity}
                        </span>
                        <span className="text-muted-foreground">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Timeline */}
                  <OrderTimeline history={order.statusHistory} />

                  {/* Estimated Delivery */}
                  {order.estimatedDeliveryTime && (
                    <div className="flex items-start gap-3">
                      <Clock size={18} className="text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Estimated Delivery</p>
                        <p className="font-semibold text-foreground">
                          {new Date(order.estimatedDeliveryTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Delivery Address */}
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Delivery Location</p>
                      <p className="font-semibold text-foreground">
                        {[order.deliveryAddress.label, order.deliveryAddress.building, order.deliveryAddress.room]
                          .filter(Boolean)
                          .join(", ") || "No details provided"}
                      </p>
                    </div>
                  </div>

                  {/* Cancellation reason */}
                  {order.cancellationReason && (
                    <Card className="p-3 bg-destructive/5 border border-destructive/20 flex-row items-start gap-2">
                      <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-destructive">Cancelled</p>
                        <p className="text-xs text-destructive/80">{order.cancellationReason}</p>
                      </div>
                    </Card>
                  )}

                  {order.dispute && <DisputeNotice dispute={order.dispute} />}

                  {/* Escrow notice */}
                  {PAYMENT_HELD_STATUSES.includes(order.status) && (
                    <Card className="p-3 bg-accent/10 border border-accent/20 flex-row items-start gap-2">
                      <AlertCircle size={16} className="text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-accent">Payment Held</p>
                        <p className="text-xs text-accent/80">
                          Your payment is securely held and will be released once you confirm delivery.
                        </p>
                      </div>
                    </Card>
                  )}

                  {/* Cancel action */}
                  {CANCELABLE_STATUSES.includes(order.status) && !isActionOnThisOrder && (
                    <Button
                      variant="outline"
                      onClick={() => setActiveAction({ orderId: order._id, mode: "cancel" })}
                      className="w-full"
                    >
                      Cancel Order
                    </Button>
                  )}

                  {isActionOnThisOrder && activeAction?.mode === "cancel" && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground block">Reason for cancelling</label>
                      <Textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Let us know what happened"
                      />
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={closeAction} className="flex-1">
                          Back
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleCancel(order)}
                          disabled={cancelOrder.isPending}
                          className="flex-1"
                        >
                          {cancelOrder.isPending ? "Cancelling..." : "Confirm Cancellation"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Confirm delivery / dispute actions */}
                  {order.status === "delivered" && !isActionOnThisOrder && (
                    <div className="space-y-2">
                      <Button
                        onClick={() => setActiveAction({ orderId: order._id, mode: "confirmDelivery" })}
                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                      >
                        Confirm Delivery & Release Payment
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setActiveAction({ orderId: order._id, mode: "dispute" })}
                        className="w-full text-destructive hover:text-destructive"
                      >
                        Report a Problem
                      </Button>
                    </div>
                  )}

                  {isActionOnThisOrder && activeAction?.mode === "dispute" && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground block">What went wrong?</label>
                      <Textarea
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder="e.g. wrong item, missing items, damaged on arrival"
                      />
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={closeAction} className="flex-1">
                          Back
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDispute(order)}
                          disabled={openDispute.isPending}
                          className="flex-1"
                        >
                          {openDispute.isPending ? "Submitting..." : "Submit for Review"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {isActionOnThisOrder && activeAction?.mode === "confirmDelivery" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-2">
                          Rate this order (optional)
                        </label>
                        <StarRating value={confirmRating} onChange={setConfirmRating} />
                      </div>
                      <Textarea
                        value={confirmReview}
                        onChange={(e) => setConfirmReview(e.target.value)}
                        placeholder="Leave a quick comment (optional)"
                      />
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={closeAction} className="flex-1">
                          Back
                        </Button>
                        <Button
                          onClick={() => handleConfirmDelivery(order)}
                          disabled={confirmDelivery.isPending}
                          className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                        >
                          {confirmDelivery.isPending ? "Confirming..." : "Confirm Delivery"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Review action */}
                  {order.status === "completed" && !reviewedOrderIds.has(order._id) && (
                    <Button variant="outline" onClick={() => setReviewOrder(order)} className="w-full">
                      Leave a Review
                    </Button>
                  )}
                  {order.status === "completed" && reviewedOrderIds.has(order._id) && (
                    <p className="text-xs text-center text-muted-foreground">You&apos;ve reviewed this order.</p>
                  )}

                  {/* Clear action - only for orders with nothing left to do */}
                  {CLEARABLE_STATUSES.includes(order.status) && (
                    <Button
                      variant="ghost"
                      onClick={() => handleClearOrder(order._id)}
                      className="w-full text-muted-foreground hover:text-destructive"
                    >
                      Clear from my list
                    </Button>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <ReviewDialog
        order={reviewOrder}
        onClose={() => setReviewOrder(null)}
        onSubmitted={(orderId) => setReviewedOrderIds((prev) => new Set(prev).add(orderId))}
        createReview={createReview}
      />
    </main>
  )
}

function ReviewDialog({
  order,
  onClose,
  onSubmitted,
  createReview,
}: {
  order: Order | null
  onClose: () => void
  onSubmitted: (orderId: string) => void
  createReview: ReturnType<typeof useCreateReview>
}) {
  const { addNotification } = useNotification()
  const [overallRating, setOverallRating] = useState(5)
  const [comment, setComment] = useState("")
  const [productRatings, setProductRatings] = useState<Record<string, number>>({})

  const resetAndClose = () => {
    setOverallRating(5)
    setComment("")
    setProductRatings({})
    onClose()
  }

  const handleSubmit = async () => {
    if (!order) return
    try {
      await createReview.mutateAsync({
        orderId: order._id,
        vendorId: getOrderVendorId(order),
        rating: overallRating,
        review: comment.trim() || undefined,
        productRatings: order.items
          .map((item) => ({ productId: getProductId(item), rating: productRatings[getProductId(item)] ?? 5 }))
          .filter((entry) => entry.productId),
      })
      addNotification("Thanks for your review!", "success")
      onSubmitted(order._id)
      resetAndClose()
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        addNotification("You've already reviewed this order.", "info")
        onSubmitted(order._id)
        resetAndClose()
        return
      }
      addNotification(error instanceof ApiError ? error.message : "Could not submit your review.", "error")
    }
  }

  return (
    <Dialog open={order !== null} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate your order</DialogTitle>
          <DialogDescription>Let {order ? getOrderVendorName(order) : "the vendor"} and other students know how it went.</DialogDescription>
        </DialogHeader>

        {order && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Overall vendor rating</p>
              <StarRating value={overallRating} onChange={setOverallRating} />
            </div>

            <div className="space-y-3">
              {order.items.map((item, index) => {
                const productId = getProductId(item)
                return (
                  <div key={productId || index} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-foreground">{item.productName}</span>
                    <StarRating
                      value={productRatings[productId] ?? 5}
                      onChange={(value) => setProductRatings((prev) => ({ ...prev, [productId]: value }))}
                    />
                  </div>
                )
              })}
            </div>

            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share more about your experience (optional)"
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createReview.isPending}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {createReview.isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DisputeNotice({ dispute }: { dispute: NonNullable<Order["dispute"]> }) {
  const outcome =
    dispute.resolution === "refund"
      ? "Resolved: your payment is being refunded."
      : dispute.resolution === "release"
        ? "Resolved: the payment was released to the vendor."
        : "Our team is reviewing this. The payment is on hold until then."

  return (
    <Card className="p-3 bg-amber-50 border border-amber-200 flex-row items-start gap-2">
      <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="text-xs font-semibold text-amber-700">Problem reported</p>
        <p className="text-xs text-amber-700/80">{dispute.reason}</p>
        <p className="text-xs font-medium text-amber-700">{outcome}</p>
        {dispute.resolutionNote && <p className="text-xs text-amber-700/80">{dispute.resolutionNote}</p>}
      </div>
    </Card>
  )
}
