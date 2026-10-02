import { afterEach, describe, expect, it, vi } from "vitest"
import { apiFetch, ApiError } from "./client"

const TOO_MANY_REQUESTS = 429

function respondWith(status: number, headers: Record<string, string> = {}, body: unknown = {}) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status, headers })))
}

async function errorFrom(path: string): Promise<ApiError> {
  return apiFetch(path, { auth: false }).then(
    () => {
      throw new Error("expected the request to fail")
    },
    (error: ApiError) => error,
  )
}

describe("apiFetch error messages", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("tells the user how many minutes to wait when rate limited", async () => {
    respondWith(TOO_MANY_REQUESTS, { "Retry-After": "325" }, { message: "ThrottlerException: Too Many Requests" })

    expect((await errorFrom("/users/login")).message).toBe("Too many attempts. Please wait 6 minutes and try again.")
  })

  it("uses the singular for a wait of under a minute", async () => {
    respondWith(TOO_MANY_REQUESTS, { "Retry-After": "20" })

    expect((await errorFrom("/users/login")).message).toBe("Too many attempts. Please wait 1 minute and try again.")
  })

  it("falls back to a general wait when the wait time is not exposed", async () => {
    respondWith(TOO_MANY_REQUESTS)

    expect((await errorFrom("/users/login")).message).toBe("Too many attempts. Please wait a few minutes and try again.")
  })

  it("replaces a list of field validation errors with a plain message", async () => {
    respondWith(400, {}, { message: ["property pricing should not exist", "items.0.property price should not exist"] })

    expect((await errorFrom("/orders/create")).message).toBe(
      "We couldn't process this request. Please refresh the page and try again.",
    )
  })

  it("keeps the field validation errors on the error for debugging", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    respondWith(400, {}, { message: ["property pricing should not exist"] })

    expect((await errorFrom("/orders/create")).details).toEqual(["property pricing should not exist"])
  })

  it("keeps the backend's message for other errors", async () => {
    respondWith(409, {}, { message: "Not enough stock left for Notebook" })

    expect((await errorFrom("/orders/create")).message).toBe("Not enough stock left for Notebook")
  })
})
