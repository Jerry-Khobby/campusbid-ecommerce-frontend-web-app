import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, waitFor } from "@testing-library/react"
import GoogleCallbackPage from "../google-callback-page"
import { useRouter, useSearchParams } from "next/navigation"
import { setTokens } from "@/lib/api/token-storage"
import { useUser } from "@/lib/user-context"
import { useNotification } from "@/lib/notification-context"

vi.mock("next/navigation", () => ({ useRouter: vi.fn(), useSearchParams: vi.fn() }))
vi.mock("@/lib/api/token-storage", () => ({ setTokens: vi.fn() }))
vi.mock("@/lib/user-context", () => ({ useUser: vi.fn() }))
vi.mock("@/lib/notification-context", () => ({ useNotification: vi.fn() }))

describe("GoogleCallbackPage", () => {
  let replace: ReturnType<typeof vi.fn>
  let addNotification: ReturnType<typeof vi.fn>

  function renderWithParams(query: string) {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams(query) as any)
    render(<GoogleCallbackPage />)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    replace = vi.fn()
    addNotification = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ replace } as any)
    vi.mocked(useNotification).mockReturnValue({ addNotification } as any)
    vi.mocked(useUser).mockReturnValue({ refetchUser: vi.fn().mockResolvedValue(undefined) } as any)
  })

  it("shows the backend's error message when the sign-in was refused", () => {
    renderWithParams("error=Your account has been suspended")

    expect(addNotification).toHaveBeenCalledWith("Your account has been suspended", "error")
  })

  it("returns to the login page without storing tokens when the sign-in was refused", () => {
    renderWithParams("error=Your account has been suspended")

    expect(replace).toHaveBeenCalledWith("/login")
    expect(setTokens).not.toHaveBeenCalled()
  })

  it("stores the tokens and goes home when the sign-in succeeded", async () => {
    renderWithParams("accessToken=access&refreshToken=refresh")

    expect(setTokens).toHaveBeenCalledWith("access", "refresh")
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/home"))
  })
})
