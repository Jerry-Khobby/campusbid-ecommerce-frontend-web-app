import { describe, expect, it } from "vitest"
import { getOrderVendorId, getOrderVendorName, type Order } from "./orders"

function buildOrder(vendorId: Order["vendorId"]): Order {
  return { vendorId } as Order
}

describe("getOrderVendorName", () => {
  it("reads the populated vendor's business name", () => {
    const order = buildOrder({ _id: "v1", profile: { businessName: "Campus Bakery" } })
    expect(getOrderVendorName(order)).toBe("Campus Bakery")
  })

  it("falls back to a generic label when vendorId is just an id string", () => {
    expect(getOrderVendorName(buildOrder("v1"))).toBe("Vendor")
  })

  it("falls back to a generic label when the referenced vendor no longer exists", () => {
    expect(getOrderVendorName(buildOrder(null))).toBe("Vendor")
  })
})

describe("getOrderVendorId", () => {
  it("returns the populated vendor's id", () => {
    expect(getOrderVendorId(buildOrder({ _id: "v1" }))).toBe("v1")
  })

  it("returns the id string as-is when not populated", () => {
    expect(getOrderVendorId(buildOrder("v1"))).toBe("v1")
  })

  it("returns an empty string when the referenced vendor no longer exists", () => {
    expect(getOrderVendorId(buildOrder(null))).toBe("")
  })
})
