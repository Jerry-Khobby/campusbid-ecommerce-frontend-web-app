"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNotification } from "@/lib/notification-context"
import { useUser } from "@/lib/user-context"
import { mockVendors } from "@/lib/mock-data"
import { OptimizedImage } from "@/components/optimized-image"

interface Conversation {
  id: number
  vendorName: string
  vendorImage: string
  lastMessage: string
  timestamp: string
  unread: boolean
  messages: Array<{
    id: number
    sender: "user" | "vendor"
    text: string
    time: string
  }>
}

const mockConversations: Conversation[] = [
  {
    id: 1,
    vendorName: "Campus Cafe",
    vendorImage: "/coffee-and-pastry.jpg",
    lastMessage: "Your order will be ready in 10 minutes",
    timestamp: "2 min ago",
    unread: true,
    messages: [
      { id: 1, sender: "user", text: "Hi, when will my order be ready?", time: "2:30 PM" },
      { id: 2, sender: "vendor", text: "Your order will be ready in 10 minutes", time: "2:32 PM" },
    ],
  },
  {
    id: 2,
    vendorName: "Tech Store",
    vendorImage: "/wireless-earbuds.png",
    lastMessage: "Thanks for your purchase!",
    timestamp: "1 hour ago",
    unread: false,
    messages: [
      { id: 1, sender: "user", text: "Do you have the wireless earbuds in stock?", time: "1:00 PM" },
      { id: 2, sender: "vendor", text: "Yes, we have them in stock", time: "1:05 PM" },
      { id: 3, sender: "user", text: "Great, I'll buy them now", time: "1:10 PM" },
      { id: 4, sender: "vendor", text: "Thanks for your purchase!", time: "1:15 PM" },
    ],
  },
  {
    id: 3,
    vendorName: "Quick Bites",
    vendorImage: "/sandwich-combo.jpg",
    lastMessage: "Order confirmed",
    timestamp: "3 hours ago",
    unread: false,
    messages: [
      { id: 1, sender: "user", text: "Can I customize my sandwich?", time: "11:00 AM" },
      { id: 2, sender: "vendor", text: "Of course! What would you like?", time: "11:05 AM" },
    ],
  },
]

const getAllVendors = () => {
  return mockVendors.map((vendor) => ({
    id: vendor.id,
    vendorName: vendor.name,
    vendorImage: vendor.image,
    lastMessage: "Start a conversation",
    timestamp: "now",
    unread: false,
    messages: [],
  }))
}

const PREDEFINED_MESSAGES = [
  "I need more of the items",
  "I am satisfied with the product",
  "Have your product been delivered",
  "I'm okay with the product",
  "Yes",
  "No",
]

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([...mockConversations, ...getAllVendors()])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isChatOpen, setIsChatOpen] = useState(false)
  const { addNotification } = useNotification()
  const { user } = useUser()

  const filteredConversations = conversations.filter((conv) =>
    conv.vendorName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSendMessage = (messageText: string) => {
    if (!messageText.trim() || !selectedConversation || !user) return

    const updatedConversations = conversations.map((conv) => {
      if (conv.id === selectedConversation.id) {
        return {
          ...conv,
          messages: [
            ...conv.messages,
            {
              id: conv.messages.length + 1,
              sender: "user" as const,
              text: messageText,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ],
          lastMessage: messageText,
          timestamp: "now",
          unread: false,
        }
      }
      return conv
    })

    setConversations(updatedConversations)
    setSelectedConversation(updatedConversations.find((c) => c.id === selectedConversation.id) || null)
    addNotification("Message sent", "success")
  }

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv)
    setIsChatOpen(true)
  }

  const handleBackToList = () => {
    setIsChatOpen(false)
  }

  if (!user) {
    return (
      <main className="w-full max-w-6xl mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please log in to access messages</p>
        </div>
      </main>
    )
  }

  return (
    <main className="w-full h-full max-w-7xl mx-auto px-2 sm:px-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-8rem)] md:h-[calc(100vh-9rem)]">
        {/* Conversations List - Hide on mobile when chat is open */}
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
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full p-3 sm:p-4 border-b border-border text-left transition-colors hover:bg-muted ${
                  selectedConversation?.id === conv.id ? "bg-muted" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <OptimizedImage
                    src={conv.vendorImage}
                    alt={conv.vendorName}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{conv.vendorName}</h3>
                      {conv.unread && <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0" />}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                    <p className="text-xs text-muted-foreground mt-1">{conv.timestamp}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area - Show on mobile when chat is open, always show on desktop */}
        {selectedConversation ? (
          <div
            className={`${!isChatOpen ? "hidden md:flex" : "flex"} md:col-span-2 border border-border rounded-lg flex-col overflow-hidden bg-card`}
          >
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-border flex items-center gap-3 flex-shrink-0">
              <button onClick={handleBackToList} className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors">
                <span className="text-xl">←</span>
              </button>
              <OptimizedImage
                src={selectedConversation.vendorImage}
                alt={selectedConversation.vendorName}
                className="w-10 h-10 rounded-full"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
                  {selectedConversation.vendorName}
                </h3>
                <p className="text-xs text-muted-foreground">Active now</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-muted/20">
              {selectedConversation.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                selectedConversation.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] sm:max-w-xs px-3 sm:px-4 py-2 rounded-lg ${
                        msg.sender === "user"
                          ? "bg-accent text-accent-foreground"
                          : "bg-card text-foreground border border-border"
                      }`}
                    >
                      <p className="text-sm break-words">{msg.text}</p>
                      <p className="text-xs opacity-70 mt-1">{msg.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Predefined Messages */}
            <div className="p-3 sm:p-4 border-t border-border bg-card flex-shrink-0">
              <p className="text-xs text-muted-foreground mb-3 text-center font-medium">
                💬 Select a quick reply to send:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PREDEFINED_MESSAGES.map((message, index) => (
                  <Button
                    key={index}
                    onClick={() => handleSendMessage(message)}
                    variant="outline"
                    className="text-xs sm:text-sm h-auto py-3 px-3 whitespace-normal text-left justify-start hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all active:scale-95 font-medium"
                  >
                    {message}
                  </Button>
                ))}
              </div>
            </div>
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
