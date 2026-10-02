import { describe, expect, it } from "vitest"
import { ApiError } from "./client"
import { isStaleBidError } from "./flash-sales"

describe("isStaleBidError", () => {
  it("treats a 409 as a bid placed against an outdated price", () => {
    expect(isStaleBidError(new ApiError(409, "A higher bid was placed"))).toBe(true)
  })

  it("does not treat a validation error as outdated", () => {
    expect(isStaleBidError(new ApiError(400, "Bid is below the minimum"))).toBe(false)
  })

  it("does not treat a network failure as outdated", () => {
    expect(isStaleBidError(new TypeError("Failed to fetch"))).toBe(false)
  })
})
