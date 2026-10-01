import { describe, expect, it } from "vitest"
import type { Address } from "./api/types"
import { resolveDeliveryAddress } from "./delivery-address"

function buildAddress(id: string, isDefault = false): Address {
  return { _id: id, label: id, isDefault } as Address
}

describe("resolveDeliveryAddress", () => {
  it("returns the chosen address when it exists", () => {
    const addresses = [buildAddress("home", true), buildAddress("hostel")]
    expect(resolveDeliveryAddress(addresses, "hostel")?._id).toBe("hostel")
  })

  it("falls back to the default address when nothing was chosen", () => {
    const addresses = [buildAddress("hostel"), buildAddress("home", true)]
    expect(resolveDeliveryAddress(addresses, "")?._id).toBe("home")
  })

  it("falls back to the first address when none is marked default", () => {
    expect(resolveDeliveryAddress([buildAddress("hostel")], "deleted")?._id).toBe("hostel")
  })

  it("returns undefined when there are no addresses", () => {
    expect(resolveDeliveryAddress([], "")).toBeUndefined()
  })
})
