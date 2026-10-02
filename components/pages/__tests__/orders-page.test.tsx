import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import OrdersPage from "../orders-page"
import { useOrders, useCancelOrder, useConfirmDelivery, useOpenDispute, type Order } from "@/lib/api/orders"
import { useRefundPayment } from "@/lib/api/payments"
import { useCreateReview } from "@/lib/api/reviews"
import { useNotification } from "@/lib/notification-context"

vi.mock("@/lib/api/orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/orders")>()
  return { ...actual, useOrders: vi.fn(), useCancelOrder: vi.fn(), useConfirmDelivery: vi.fn(), useOpenDispute: vi.fn() }
})
vi.mock("@/lib/api/payments", () => ({ useRefundPayment: vi.fn() }))
vi.mock("@/lib/api/reviews", () => ({ useCreateReview: vi.fn() }))
vi.mock("@/lib/notification-context", () => ({ useNotification: vi.fn() }))

const DELIVERED_ORDER: Order = {
  _id: "order_1",
  orderNumber: "CB-1001",
  customerId: "customer_1",
  vendorId: { _id: "vendor_1", profile: { businessName: "Test Vendor" } },
  items: [
    { productId: "prod_1", productName: "Notebook", quantity: 1, price: 9, isFlashSale: false },
  ],
  pricing: { subtotal: 9, deliveryFee: 1, serviceFee: 0, total: 10 },
  deliveryAddress: { location: { type: "Point", coordinates: [0, 0] } },
  status: "delivered",
  statusHistory: [{ status: "pending", timestamp: "2026-01-01T00:00:00.000Z" }],
  paymentId: "pay_1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

describe("OrdersPage dispute flow", () => {
  let addNotification: ReturnType<typeof vi.fn>
  let openDisputeMutateAsync: ReturnType<typeof vi.fn>
  let refundMutateAsync: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.mocked(useOrders).mockReturnValue({ data: [DELIVERED_ORDER], isLoading: false, isError: false } as any)
    vi.mocked(useCancelOrder).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
    vi.mocked(useConfirmDelivery).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
    vi.mocked(useCreateReview).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)

    addNotification = vi.fn()
    vi.mocked(useNotification).mockReturnValue({ addNotification } as any)

    openDisputeMutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useOpenDispute).mockReturnValue({ mutateAsync: openDisputeMutateAsync, isPending: false } as any)

    refundMutateAsync = vi.fn()
    vi.mocked(useRefundPayment).mockReturnValue({ mutateAsync: refundMutateAsync, isPending: false } as any)
  })

  async function expandOrderCard() {
    fireEvent.click(screen.getByText("Notebook"))
    expect(await screen.findByText("Report a Problem")).toBeInTheDocument()
  }

  async function submitDispute(reason: string) {
    const user = userEvent.setup()
    render(<OrdersPage />)
    await expandOrderCard()

    fireEvent.click(screen.getByText("Report a Problem"))
    if (reason) await user.type(screen.getByPlaceholderText(/wrong item, missing items/i), reason)
    fireEvent.click(screen.getByText("Submit for Review"))
  }

  it("asks for more detail instead of submitting a too-short report", async () => {
    await submitDispute("Bad")

    await waitFor(() =>
      expect(addNotification).toHaveBeenCalledWith(
        "Please describe what went wrong (at least 10 characters).",
        "error",
      ),
    )
    expect(openDisputeMutateAsync).not.toHaveBeenCalled()
  })

  it("opens a dispute on the order with the typed reason", async () => {
    await submitDispute("Wrong item delivered")

    await waitFor(() =>
      expect(openDisputeMutateAsync).toHaveBeenCalledWith({ id: "order_1", reason: "Wrong item delivered" }),
    )
  })

  it("never refunds directly; an admin decides after review", async () => {
    await submitDispute("Wrong item delivered")

    await waitFor(() => expect(openDisputeMutateAsync).toHaveBeenCalled())
    expect(refundMutateAsync).not.toHaveBeenCalled()
  })

  it("tells the customer the payment is on hold pending review", async () => {
    await submitDispute("Wrong item delivered")

    await waitFor(() =>
      expect(addNotification).toHaveBeenCalledWith(expect.stringContaining("on hold while our team reviews it"), "success"),
    )
  })
})

describe("OrdersPage disputed order", () => {
  beforeEach(() => {
    vi.mocked(useCancelOrder).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
    vi.mocked(useConfirmDelivery).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
    vi.mocked(useCreateReview).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
    vi.mocked(useNotification).mockReturnValue({ addNotification: vi.fn() } as any)
    vi.mocked(useOpenDispute).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
    vi.mocked(useRefundPayment).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
    vi.mocked(useOpenDispute).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
  })

  function renderDisputedOrder(dispute: Order["dispute"], status: Order["status"] = "disputed") {
    vi.mocked(useOrders).mockReturnValue({
      data: [{ ...DELIVERED_ORDER, status, dispute }],
      isLoading: false,
      isError: false,
    } as any)
    render(<OrdersPage />)
    fireEvent.click(screen.getByText("Notebook"))
  }

  it("shows the reported problem while it is under review", async () => {
    renderDisputedOrder({ reason: "Two notebooks missing", openedAt: "2026-01-02T00:00:00.000Z" })

    expect(await screen.findByText("Two notebooks missing")).toBeInTheDocument()
    expect(screen.getByText(/payment is on hold until then/i)).toBeInTheDocument()
  })

  it("no longer offers confirm delivery or another report once disputed", async () => {
    renderDisputedOrder({ reason: "Two notebooks missing", openedAt: "2026-01-02T00:00:00.000Z" })

    await screen.findByText("Two notebooks missing")
    expect(screen.queryByText("Report a Problem")).not.toBeInTheDocument()
    expect(screen.queryByText(/Confirm Delivery/)).not.toBeInTheDocument()
  })

  it("shows the outcome and the admin's note once resolved", async () => {
    renderDisputedOrder(
      {
        reason: "Two notebooks missing",
        openedAt: "2026-01-02T00:00:00.000Z",
        resolution: "refund",
        resolutionNote: "Vendor confirmed the shortage",
      },
      "refunded",
    )

    expect(await screen.findByText("Resolved: your payment is being refunded.")).toBeInTheDocument()
    expect(screen.getByText("Vendor confirmed the shortage")).toBeInTheDocument()
  })
})

describe("OrdersPage status timeline", () => {
  beforeEach(() => {
    vi.mocked(useCancelOrder).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
    vi.mocked(useConfirmDelivery).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
    vi.mocked(useCreateReview).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
    vi.mocked(useNotification).mockReturnValue({ addNotification: vi.fn() } as any)
    vi.mocked(useRefundPayment).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
    vi.mocked(useOpenDispute).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
  })

  it("renders every status-history entry in order", async () => {
    vi.mocked(useOrders).mockReturnValue({
      data: [
        {
          ...DELIVERED_ORDER,
          statusHistory: [
            { status: "pending", timestamp: "2026-01-01T00:00:00.000Z", note: "Order created" },
            { status: "accepted", timestamp: "2026-01-01T01:00:00.000Z" },
            { status: "delivered", timestamp: "2026-01-01T02:00:00.000Z" },
          ],
        },
      ],
      isLoading: false,
      isError: false,
    } as any)

    render(<OrdersPage />)
    fireEvent.click(screen.getByText("Notebook"))

    expect(await screen.findByText("Order Timeline")).toBeInTheDocument()
    expect(screen.getByText("Pending")).toBeInTheDocument()
    expect(screen.getByText("Accepted")).toBeInTheDocument()
    // "Delivered" also appears in the status badge at the top of the card.
    expect(screen.getAllByText("Delivered").length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText("Order created")).toBeInTheDocument()
  })

  it("renders nothing when there is no status history", async () => {
    vi.mocked(useOrders).mockReturnValue({
      data: [{ ...DELIVERED_ORDER, statusHistory: [] }],
      isLoading: false,
      isError: false,
    } as any)

    render(<OrdersPage />)
    fireEvent.click(screen.getByText("Notebook"))

    await screen.findByText("Report a Problem")
    expect(screen.queryByText("Order Timeline")).not.toBeInTheDocument()
  })
})

describe("OrdersPage cancellation", () => {
  beforeEach(() => {
    vi.mocked(useCancelOrder).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
    vi.mocked(useConfirmDelivery).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
    vi.mocked(useCreateReview).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
    vi.mocked(useNotification).mockReturnValue({ addNotification: vi.fn() } as any)
    vi.mocked(useRefundPayment).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
    vi.mocked(useOpenDispute).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
  })

  function renderOrderWithStatus(status: Order["status"]) {
    vi.mocked(useOrders).mockReturnValue({
      data: [{ ...DELIVERED_ORDER, status }],
      isLoading: false,
      isError: false,
    } as any)
    render(<OrdersPage />)
    fireEvent.click(screen.getByText("Notebook"))
  }

  it.each(["pending", "accepted"] as const)("offers cancellation for a %s order", async (status) => {
    renderOrderWithStatus(status)

    expect(await screen.findByText("Cancel Order")).toBeInTheDocument()
  })

  it.each(["preparing", "ready", "out_for_delivery"] as const)(
    "does not offer cancellation once the order is %s",
    async (status) => {
      renderOrderWithStatus(status)

      await screen.findByText("Payment Held")
      expect(screen.queryByText("Cancel Order")).not.toBeInTheDocument()
    },
  )
})
