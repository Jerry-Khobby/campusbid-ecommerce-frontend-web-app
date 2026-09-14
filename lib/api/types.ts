// Shared types mirroring backend response shapes (see campus-bid-backend-web-app/docs/*.md).
// Kept here rather than duplicated per-domain file since User/Address/PaymentMethod
// are referenced from several domains (auth, users, orders).

export interface Address {
  _id: string
  label: string
  building?: string
  room?: string
  location: { type: "Point"; coordinates: [number, number] }
  instructions?: string
  isDefault?: boolean
}

export interface PaymentMethodRecord {
  _id: string
  type: string
  provider: string
  last4: string
  isDefault?: boolean
  metadata?: Record<string, unknown>
}

export interface SafeUser {
  _id: string
  email: string
  role: "student" | "admin" | "vendor"
  authProvider: "local" | "google"
  profile: {
    firstName?: string
    lastName?: string
    phoneNumber?: string
    studentId?: string
    university?: string
    profileImage?: string
  }
  addresses: Address[]
  paymentMethods: PaymentMethodRecord[]
  savedItems: string[]
  isVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}
