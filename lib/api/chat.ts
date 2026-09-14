import { apiFetch } from "./client"

export interface Conversation {
  _id: string
  participants: { customerId: string; vendorId: string }
  orderId?: string
  lastMessage?: { text: string; senderId: string; timestamp: string }
  unreadCount: { customer: number; vendor: number }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Message {
  _id: string
  conversationId: string
  senderId: string
  senderType: "customer" | "vendor"
  messageType: "text" | "predefined" | "image"
  content: string
  predefinedMessageId?: string
  isRead: boolean
  readAt?: string
  createdAt: string
}

export interface PredefinedMessage {
  _id: string
  role: "customer" | "vendor" | "both"
  category: string
  text: string
  isActive: boolean
  sortOrder: number
  createdAt: string
}

/** Public vendor fields needed to render a conversation (see docs/vendors.md GET /api/vendors/:id). */
export interface VendorSummary {
  _id: string
  profile: { businessName: string; logo?: string }
}

export const chatConversationsQueryKey = ["chat", "conversations"] as const

export function chatMessagesQueryKey(conversationId: string) {
  return ["chat", "conversations", conversationId, "messages"] as const
}

export function predefinedMessagesQueryKey(role?: string, category?: string) {
  return ["chat", "predefined-messages", role, category] as const
}

export function vendorSummaryQueryKey(vendorId: string) {
  return ["vendors", vendorId, "summary"] as const
}

/** The caller's own conversations (role-derived server-side). */
export async function fetchConversations(): Promise<Conversation[]> {
  const json = await apiFetch<{ data: Conversation[] }>("/chat/conversations")
  return json.data
}

/** A page of a conversation's messages, newest-first as returned by the server. */
export async function fetchMessages(conversationId: string, skip = 0, limit = 30): Promise<Message[]> {
  const json = await apiFetch<{ data: Message[] }>(`/chat/conversations/${conversationId}/messages`, {
    query: { skip, limit },
  })
  return json.data
}

export async function fetchPredefinedMessages(role?: "customer" | "vendor", category?: string): Promise<PredefinedMessage[]> {
  const json = await apiFetch<{ data: PredefinedMessage[] }>("/chat/predefined-messages", {
    query: { role, category },
  })
  return json.data
}

/** Finds or creates the conversation with a vendor (customerId is derived from the JWT server-side). */
export async function startConversation(vendorId: string, orderId?: string): Promise<Conversation> {
  const json = await apiFetch<{ data: Conversation }>("/chat/conversations", {
    method: "POST",
    body: { vendorId, orderId },
  })
  return json.data
}

/** Public vendor profile, used to render a vendor's name/logo next to a conversation. */
export async function fetchVendorSummary(vendorId: string): Promise<VendorSummary> {
  const json = await apiFetch<{ vendor: VendorSummary }>(`/vendors/${vendorId}`)
  return json.vendor
}
