import type { Address } from "./api/types"

// The chosen address wins while it still exists; otherwise fall back to the
// default (or first) address, so an address added or deleted elsewhere after
// checkout mounted is still picked up.
export function resolveDeliveryAddress(addresses: Address[], chosenAddressId: string): Address | undefined {
  return (
    addresses.find((address) => address._id === chosenAddressId) ??
    addresses.find((address) => address.isDefault) ??
    addresses[0]
  )
}
