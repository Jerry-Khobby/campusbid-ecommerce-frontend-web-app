"use client"

import ChatPage from "@/components/pages/chat-page"
import { useRequireAuth } from "@/hooks/use-require-auth"

export default function Chat() {
  const isLoggedIn = useRequireAuth("Please log in to chat with vendors")

  if (!isLoggedIn) {
    return null
  }

  return <ChatPage />
}
