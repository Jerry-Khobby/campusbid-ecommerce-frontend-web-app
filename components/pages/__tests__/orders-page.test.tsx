import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import OrdersPage from "../orders-page"
import { useOrders, useCancelOrder, useConfirmDelivery, type Order } from "@/lib/api/orders"
import { useRefundPayment } from "@/lib/api/payments"
import { useCreateReview } from "@/lib/api/reviews"
import { useNotification } from "@/lib/notification-context"

vi.mock("@/lib/api/orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/orders")>()
  return { ...actual, useOrders: vi.fn(), useCancelOrder: vi.fn(), useConfirmDelivery: vi.fn() }
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
  let refundMutateAsync: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.mocked(useOrders).mockReturnValue({ data: [DELIVERED_ORDER], isLoading: false, isError: false } as any)
    vi.mocked(useCancelOrder).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
    vi.mocked(useConfirmDelivery).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
    vi.mocked(useCreateReview).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)

    addNotification = vi.fn()
    vi.mocked(useNotification).mockReturnValue({ addNotification } as any)

    refundMutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useRefundPayment).mockReturnValue({ mutateAsync: refundMutateAsync, isPending: false } as any)
  })

  async function expandOrderCard() {
    fireEvent.click(screen.getByText("Notebook"))
    expect(await screen.findByText("Report a Problem")).toBeInTheDocument()
  }

  it("shows an error and does not call refundPayment when the reason is empty", async () => {
    render(<OrdersPage />)
    await expandOrderCard()

    fireEvent.click(screen.getByText("Report a Problem"))
    fireEvent.click(screen.getByText("Submit Dispute & Refund"))

    await waitFor(() => expect(addNotification).toHaveBeenCalledWith("Please describe what went wrong.", "error"))
    expect(refundMutateAsync).not.toHaveBeenCalled()
  })

  it("submits the dispute with the payment id and typed reason", async () => {
    const user = userEvent.setup()
    render(<OrdersPage />)
    await expandOrderCard()

    fireEvent.click(screen.getByText("Report a Problem"))
    await user.type(screen.getByPlaceholderText(/wrong item, missing items/i), "Wrong item delivered")
    fireEvent.click(screen.getByText("Submit Dispute & Refund"))

    await waitFor(() =>
      expect(refundMutateAsync).toHaveBeenCalledWith({ paymentId: "pay_1", reason: "Wrong item delivered" }),
    )
    await waitFor(() =>
      expect(addNotification).toHaveBeenCalledWith(
        "Dispute submitted. Your refund has been initiated and should reflect in a few business days.",
        "success",
      ),
    )
  })

  it("shows an error instead of calling refundPayment when the order has no paymentId", async () => {
    vi.mocked(useOrders).mockReturnValue({
      data: [{ ...DELIVERED_ORDER, paymentId: undefined }],
      isLoading: false,
      isError: false,
    } as any)
    const user = userEvent.setup()
    render(<OrdersPage />)
    await expandOrderCard()

    fireEvent.click(screen.getByText("Report a Problem"))
    await user.type(screen.getByPlaceholderText(/wrong item, missing items/i), "Wrong item delivered")
    fireEvent.click(screen.getByText("Submit Dispute & Refund"))

    await waitFor(() =>
      expect(addNotification).toHaveBeenCalledWith("This order has no payment on file to dispute.", "error"),
    )
    expect(refundMutateAsync).not.toHaveBeenCalled()
  })
})

describe("OrdersPage status timeline", () => {
  beforeEach(() => {
    vi.mocked(useCancelOrder).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
    vi.mocked(useConfirmDelivery).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
    vi.mocked(useCreateReview).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
    vi.mocked(useNotification).mockReturnValue({ addNotification: vi.fn() } as any)
    vi.mocked(useRefundPayment).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
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
