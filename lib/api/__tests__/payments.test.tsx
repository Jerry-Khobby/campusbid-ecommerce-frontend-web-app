import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useRefundPayment } from "../payments"

function createWrapper() {
  const queryClient = new QueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe("useRefundPayment", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  it("PUTs to /payments/:id/refund with just the reason when no amount is given", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ _id: "pay_1", status: "refunded" }),
    } as Response)

    const { result } = renderHook(() => useRefundPayment(), { wrapper: createWrapper() })

    await result.current.mutateAsync({ paymentId: "pay_1", reason: "item never arrived" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/payments/pay_1/refund"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ reason: "item never arrived" }),
      }),
    )
  })

  it("includes the amount in the request body when provided", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ _id: "pay_1", status: "refunded" }),
    } as Response)

    const { result } = renderHook(() => useRefundPayment(), { wrapper: createWrapper() })

    await result.current.mutateAsync({ paymentId: "pay_1", reason: "damaged item", amount: 12.5 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ reason: "damaged item", amount: 12.5 }),
      }),
    )
  })

  it("rejects when the backend returns a non-2xx response", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ message: "Payment cannot be refunded in current state" }),
    } as Response)

    const { result } = renderHook(() => useRefundPayment(), { wrapper: createWrapper() })

    await expect(result.current.mutateAsync({ paymentId: "pay_1", reason: "x" })).rejects.toThrow(
      "Payment cannot be refunded in current state",
    )
  })
})
