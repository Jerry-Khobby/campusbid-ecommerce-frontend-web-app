import { apiFetch, apiUpload } from "./client"
import type { Address, PaymentMethodRecord, SafeUser } from "./types"

export interface ProfileUpdateInput {
  firstName?: string
  lastName?: string
  phoneNumber?: string
  studentId?: string
  university?: string
}

export interface AddressInput {
  label: string
  building?: string
  room?: string
  instructions?: string
  latitude: number
  longitude: number
  isDefault?: boolean
}

export type AddressUpdateInput = Partial<AddressInput>

export interface PaymentMethodInput {
  type: string
  provider: string
  last4: string
  isDefault?: boolean
  metadata?: Record<string, unknown>
}

export async function updateProfile(data: ProfileUpdateInput): Promise<SafeUser> {
  const json = await apiFetch<{ user: SafeUser }>("/users/profile", {
    method: "PUT",
    body: { profile: data },
  })
  return json.user
}

export async function uploadProfileImage(file: File): Promise<SafeUser> {
  const formData = new FormData()
  formData.append("profileImage", file)

  const json = await apiUpload<{ user: SafeUser }>("/users/profile/image", formData)
  return json.user
}

export async function fetchAddresses(): Promise<Address[]> {
  const json = await apiFetch<{ addresses: Address[] }>("/users/addresses")
  return json.addresses
}

export async function addAddress(data: AddressInput): Promise<Address[]> {
  const json = await apiFetch<{ addresses: Address[] }>("/users/addresses", {
    method: "POST",
    body: data,
  })
  return json.addresses
}

export async function updateAddress(id: string, data: AddressUpdateInput): Promise<Address[]> {
  const json = await apiFetch<{ addresses: Address[] }>(`/users/addresses/${id}`, {
    method: "PUT",
    body: data,
  })
  return json.addresses
}

export async function deleteAddress(id: string): Promise<Address[]> {
  const json = await apiFetch<{ addresses: Address[] }>(`/users/addresses/${id}`, {
    method: "DELETE",
  })
  return json.addresses
}

export async function fetchPaymentMethods(): Promise<PaymentMethodRecord[]> {
  const json = await apiFetch<{ paymentMethods: PaymentMethodRecord[] }>("/users/payment-methods")
  return json.paymentMethods
}

export async function addPaymentMethod(data: PaymentMethodInput): Promise<PaymentMethodRecord[]> {
  const json = await apiFetch<{ paymentMethods: PaymentMethodRecord[] }>("/users/payment-methods", {
    method: "POST",
    body: data,
  })
  return json.paymentMethods
}

export async function deletePaymentMethod(id: string): Promise<PaymentMethodRecord[]> {
  const json = await apiFetch<{ paymentMethods: PaymentMethodRecord[] }>(`/users/payment-methods/${id}`, {
    method: "DELETE",
  })
  return json.paymentMethods
}
