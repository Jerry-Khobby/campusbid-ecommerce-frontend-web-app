import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NotificationsPanel } from "../notifications-panel"
import { useRouter } from "next/navigation"
import { useNotification } from "@/lib/notification-context"
import {
  clearAllNotifications,
  fetchNotifications,
  markNotificationAsRead,
  type AppNotification,
} from "@/lib/api/notifications"

vi.mock("next/navigation", () => ({ useRouter: vi.fn() }))
vi.mock("@/lib/notification-context", () => ({ useNotification: vi.fn() }))
vi.mock("@/lib/api/notifications", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/notifications")>()
  return {
    ...actual,
    fetchNotifications: vi.fn(),
    markNotificationAsRead: vi.fn(),
    markAllNotificationsAsRead: vi.fn(),
    deleteNotification: vi.fn(),
    clearAllNotifications: vi.fn(),
  }
})

const ORDER_NOTIFICATION: AppNotification = {
  _id: "n1",
  userId: "u1",
  userType: "customer",
  type: "order_status_changed",
  title: "Order Delivered",
  message: "Your order was delivered",
  data: { orderId: "o1" },
  isRead: false,
  createdAt: new Date().toISOString(),
}

describe("NotificationsPanel", () => {
  let push: ReturnType<typeof vi.fn>

  function renderPanel(onNavigate = vi.fn()) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <NotificationsPanel onNavigate={onNavigate} />
      </QueryClientProvider>,
    )
    return onNavigate
  }

  beforeEach(() => {
    vi.clearAllMocks()
    push = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push } as any)
    vi.mocked(useNotification).mockReturnValue({ addNotification: vi.fn() } as any)
    vi.mocked(fetchNotifications).mockResolvedValue([ORDER_NOTIFICATION])
    vi.mocked(markNotificationAsRead).mockResolvedValue({ ...ORDER_NOTIFICATION, isRead: true })
    vi.mocked(clearAllNotifications).mockResolvedValue(undefined)
  })

  it("marks a notification as read when it is opened", async () => {
    renderPanel()

    fireEvent.click(await screen.findByText("Order Delivered"))

    await waitFor(() => expect(markNotificationAsRead).toHaveBeenCalledWith("n1", expect.anything()))
  })

  it("takes the customer to the page the notification is about, closing the bell", async () => {
    const onNavigate = renderPanel()

    fireEvent.click(await screen.findByText("Order Delivered"))

    expect(push).toHaveBeenCalledWith("/orders")
    expect(onNavigate).toHaveBeenCalled()
  })

  it("shows how many notifications are unread", async () => {
    renderPanel()

    expect(await screen.findByText("1 unread")).toBeInTheDocument()
  })

  it("asks for confirmation before clearing every notification", async () => {
    renderPanel()

    fireEvent.click(await screen.findByText("Clear all"))

    expect(clearAllNotifications).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText("Clear all?"))
    await waitFor(() => expect(clearAllNotifications).toHaveBeenCalled())
  })
})
