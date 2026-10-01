"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useQueries, useQuery } from "@tanstack/react-query"
import type { Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNotification } from "@/lib/notification-context"
import { useUser } from "@/lib/user-context"
import { OptimizedImage } from "@/components/optimized-image"
import {
  type Conversation,
  type Message,
  type PredefinedMessage,
  type VendorSummary,
  chatConversationsQueryKey,
  chatMessagesQueryKey,
  fetchConversations,
  fetchMessages,
  fetchPredefinedMessages,
  fetchVendorSummary,
  predefinedMessagesQueryKey,
  vendorSummaryQueryKey,
} from "@/lib/api/chat"
import {
  CHAT_EVENTS,
  createChatSocket,
  joinConversation,
  markConversationRead,
  sendChatMessage,
} from "@/lib/socket/chat-socket"

const PREDEFINED_ROLE = "customer"
const CHAT_INPUT_MAX_LENGTH = 1000
const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatRelativeTime(iso: string): string {
  const elapsedMs = Date.now() - new Date(iso).getTime()
  if (elapsedMs < MINUTE_MS) return "just now"
  if (elapsedMs < HOUR_MS) return `${Math.floor(elapsedMs / MINUTE_MS)}m ago`
  if (elapsedMs < DAY_MS) return `${Math.floor(elapsedMs / HOUR_MS)}h ago`
  return new Date(iso).toLocaleDateString()
}

function sortMessagesChronologically(messages: Message[]): Message[] {
  return [...messages].reverse()
}

interface ConversationListItemProps {
  conversation: Conversation
  vendor: VendorSummary | undefined
  isSelected: boolean
  onSelect: (conversation: Conversation) => void
}

function ConversationListItem({ conversation, vendor, isSelected, onSelect }: ConversationListItemProps) {
  const vendorName = vendor?.profile.businessName ?? "Vendor"
  const hasUnread = conversation.unreadCount.customer > 0
  const preview = conversation.lastMessage?.text ?? "Start a conversation"
  const timestamp = conversation.lastMessage ? formatRelativeTime(conversation.lastMessage.timestamp) : ""

  return (
    <button
      onClick={() => onSelect(conversation)}
      className={`w-full p-3 sm:p-4 border-b border-border text-left transition-colors hover:bg-muted ${
        isSelected ? "bg-muted" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <OptimizedImage
          src={vendor?.profile.logo ?? ""}
          alt={vendorName}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{vendorName}</h3>
            {hasUnread && <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0" />}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{preview}</p>
          <p className="text-xs text-muted-foreground mt-1">{timestamp}</p>
        </div>
      </div>
    </button>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isOwnMessage = message.senderType === "customer"

  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] sm:max-w-xs px-3 sm:px-4 py-2 rounded-lg ${
          isOwnMessage ? "bg-accent text-accent-foreground" : "bg-card text-foreground border border-border"
        }`}
      >
        <p className="text-sm break-words">{message.content}</p>
        <p className="text-xs opacity-70 mt-1">{formatMessageTime(message.createdAt)}</p>
      </div>
    </div>
  )
}

interface PredefinedMessageGridProps {
  predefinedMessages: PredefinedMessage[]
  onSelect: (message: PredefinedMessage) => void
}

function PredefinedMessageGrid({ predefinedMessages, onSelect }: PredefinedMessageGridProps) {
  if (predefinedMessages.length === 0) return null

  return (
    <div className="p-3 sm:p-4 border-t border-border bg-card flex-shrink-0">
      <p className="text-xs text-muted-foreground mb-3 text-center font-medium">💬 Select a message to send:</p>
      <div className="grid grid-cols-2 gap-2">
        {predefinedMessages.map((message) => (
          <Button
            key={message._id}
            onClick={() => onSelect(message)}
            variant="outline"
            className="text-xs sm:text-sm h-auto py-3 px-3 whitespace-normal text-left justify-start hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all active:scale-95 font-medium"
          >
            {message.text}
          </Button>
        ))}
      </div>
    </div>
  )
}

/** Builds a vendorId -> profile lookup so the conversation list can show names/logos without a hook-per-row. */
function useVendorSummaries(conversations: Conversation[]): Map<string, VendorSummary> {
  const vendorIds = useMemo(
    () => Array.from(new Set(conversations.map((conversation) => conversation.participants.vendorId))),
    [conversations],
  )

  const vendorQueries = useQueries({
    queries: vendorIds.map((vendorId) => ({
      queryKey: vendorSummaryQueryKey(vendorId),
      queryFn: () => fetchVendorSummary(vendorId),
      staleTime: 5 * MINUTE_MS,
    })),
  })

  return useMemo(() => {
    const summaries = new Map<string, VendorSummary>()
    vendorIds.forEach((vendorId, index) => {
      const summary = vendorQueries[index]?.data
      if (summary) summaries.set(vendorId, summary)
    })
    return summaries
  }, [vendorIds, vendorQueries])
}

export default function ChatPage() {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const conversationIdFromUrl = searchParams.get("conversation")

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(conversationIdFromUrl)
  const [isChatOpen, setIsChatOpen] = useState(conversationIdFromUrl !== null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageDraft, setMessageDraft] = useState("")

  const socketRef = useRef<Socket | null>(null)
  const selectedConversationIdRef = useRef<string | null>(null)

  const conversationsQuery = useQuery({ queryKey: chatConversationsQueryKey, queryFn: fetchConversations })
  const conversations = useMemo(() => conversationsQuery.data ?? [], [conversationsQuery.data])
  const vendorSummaries = useVendorSummaries(conversations)

  const messagesQuery = useQuery({
    queryKey: chatMessagesQueryKey(selectedConversationId ?? ""),
    queryFn: () => fetchMessages(selectedConversationId as string),
    enabled: selectedConversationId !== null,
  })

  const predefinedQuery = useQuery({
    queryKey: predefinedMessagesQueryKey(PREDEFINED_ROLE),
    queryFn: () => fetchPredefinedMessages(PREDEFINED_ROLE),
  })

  useReportQueryError(conversationsQuery.isError, "Failed to load conversations")
  useReportQueryError(messagesQuery.isError, "Failed to load messages")

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation._id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  )

  const filteredConversations = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return conversations.filter((conversation) => {
      const vendorName = vendorSummaries.get(conversation.participants.vendorId)?.profile.businessName ?? ""
      return vendorName.toLowerCase().includes(query)
    })
  }, [conversations, vendorSummaries, searchQuery])

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId
  }, [selectedConversationId])

  // Connect once on mount; the same socket is reused across conversation switches and re-renders.
  useEffect(() => {
    const socket = createChatSocket()
    socketRef.current = socket

    const handleMessageReceived = (message: Message) => {
      if (message.conversationId !== selectedConversationIdRef.current) return
      setMessages((previous) => [...previous, message])
    }
    const handleMessageRead = () => {
      // Read receipts aren't surfaced in this UI yet; acknowledging the event keeps the listener list explicit.
    }

    socket.on(CHAT_EVENTS.messageReceived, handleMessageReceived)
    socket.on(CHAT_EVENTS.messageRead, handleMessageRead)
    socket.connect()

    return () => {
      socket.off(CHAT_EVENTS.messageReceived, handleMessageReceived)
      socket.off(CHAT_EVENTS.messageRead, handleMessageRead)
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  // Join the selected conversation's room and mark it read whenever the selection changes.
  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !selectedConversationId) return

    const joinAndMarkRead = () => {
      joinConversation(socket, selectedConversationId)
      markConversationRead(socket, selectedConversationId)
    }

    if (socket.connected) joinAndMarkRead()
    else socket.once("connect", joinAndMarkRead)

    return () => {
      socket.off("connect", joinAndMarkRead)
    }
  }, [selectedConversationId])

  useEffect(() => {
    setMessages([])
    setMessageDraft("")
  }, [selectedConversationId])

  useEffect(() => {
    if (messagesQuery.data) setMessages(sortMessagesChronologically(messagesQuery.data))
  }, [messagesQuery.data])

  const handleSelectPredefinedMessage = (predefined: PredefinedMessage) => {
    const socket = socketRef.current
    if (!socket || !selectedConversationId || !user) return

    sendChatMessage(socket, {
      conversationId: selectedConversationId,
      messageType: "predefined",
      content: predefined.text,
      predefinedMessageId: predefined._id,
    })
  }

  const handleSendFreeTextMessage = () => {
    const content = messageDraft.trim()
    const socket = socketRef.current
    if (!content || !socket || !selectedConversationId || !user) return

    sendChatMessage(socket, {
      conversationId: selectedConversationId,
      messageType: "text",
      content,
    })
    setMessageDraft("")
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversationId(conversation._id)
    setIsChatOpen(true)
  }

  const handleBackToList = () => setIsChatOpen(false)

  if (!user) {
    return (
      <main className="w-full max-w-6xl mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please log in to access messages</p>
        </div>
      </main>
    )
  }

  const selectedVendor = selectedConversation
    ? vendorSummaries.get(selectedConversation.participants.vendorId)
    : undefined

  return (
    <main className="w-full h-full max-w-7xl mx-auto px-2 sm:px-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-8rem)] md:h-[calc(100vh-9rem)]">
        <div
          className={`${isChatOpen ? "hidden md:block" : "block"} md:col-span-1 border border-border rounded-lg flex flex-col overflow-hidden bg-card`}
        >
          <div className="p-3 sm:p-4 border-b border-border flex-shrink-0">
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3">Messages</h2>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">🔍</span>
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversationsQuery.isLoading && (
              <p className="text-sm text-muted-foreground text-center py-6">Loading conversations…</p>
            )}
            {!conversationsQuery.isLoading && filteredConversations.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No conversations yet</p>
            )}
            {filteredConversations.map((conversation) => (
              <ConversationListItem
                key={conversation._id}
                conversation={conversation}
                vendor={vendorSummaries.get(conversation.participants.vendorId)}
                isSelected={selectedConversationId === conversation._id}
                onSelect={handleSelectConversation}
              />
            ))}
          </div>
        </div>

        {selectedConversation ? (
          <div
            className={`${!isChatOpen ? "hidden md:flex" : "flex"} md:col-span-2 border border-border rounded-lg flex-col overflow-hidden bg-card`}
          >
            <div className="p-3 sm:p-4 border-b border-border flex items-center gap-3 flex-shrink-0">
              <button onClick={handleBackToList} className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors">
                <span className="text-xl">←</span>
              </button>
              <OptimizedImage
                src={selectedVendor?.profile.logo ?? ""}
                alt={selectedVendor?.profile.businessName ?? "Vendor"}
                className="w-10 h-10 rounded-full"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
                  {selectedVendor?.profile.businessName ?? "Vendor"}
                </h3>
                <p className="text-xs text-muted-foreground">Active now</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-muted/20">
              {messagesQuery.isLoading && (
                <p className="text-center text-muted-foreground text-sm">Loading messages…</p>
              )}
              {!messagesQuery.isLoading && messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
                </div>
              )}
              {messages.map((message) => (
                <MessageBubble key={message._id} message={message} />
              ))}
            </div>

            <PredefinedMessageGrid
              predefinedMessages={predefinedQuery.data ?? []}
              onSelect={handleSelectPredefinedMessage}
            />

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendFreeTextMessage()
              }}
              className="p-3 sm:p-4 border-t border-border bg-card flex-shrink-0 flex items-center gap-2"
            >
              <Input
                type="text"
                placeholder="Type a message..."
                value={messageDraft}
                onChange={(e) => setMessageDraft(e.target.value)}
                maxLength={CHAT_INPUT_MAX_LENGTH}
                className="flex-1"
              />
              <Button type="submit" disabled={messageDraft.trim().length === 0}>
                Send
              </Button>
            </form>
          </div>
        ) : (
          <div className="hidden md:flex md:col-span-2 border border-border rounded-lg items-center justify-center bg-card">
            <div className="text-center p-6">
              <span className="text-5xl opacity-50 block mb-4">💬</span>
              <p className="text-muted-foreground text-sm">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

/** Toasts a query's error state exactly once per failure, instead of leaving it silent or re-toasting on every render. */
function useReportQueryError(isError: boolean, message: string): void {
  const { addNotification } = useNotification()

  useEffect(() => {
    if (isError) addNotification(message, "error")
  }, [isError, message, addNotification])
}
