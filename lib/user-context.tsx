"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { fetchCurrentUser, loginUser, logoutUser, registerUser } from "./api/auth"
import { getAccessToken } from "./api/token-storage"
import type { SafeUser } from "./api/types"

export type User = SafeUser

const SAVED_ITEMS_STORAGE_KEY = "campusbid.savedItemIds"

interface UserContextType {
  user: User | null
  isLoggedIn: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refetchUser: () => Promise<void>
  // Client-only "wishlist" — the backend has no endpoint to read/write
  // savedItems (confirmed in docs/users.md: the field exists on the User
  // schema but nothing serves/mutates it), so this is intentionally local
  // state, not synced to the account. Persisted to localStorage so it
  // survives a reload, but it's per-browser, not per-account.
  savedItemIds: string[]
  toggleSavedItem: (productId: string) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function getDisplayName(user: User | null): string {
  if (!user) return ""
  const name = [user.profile.firstName, user.profile.lastName].filter(Boolean).join(" ")
  return name || user.email
}

export function getInitials(user: User | null): string {
  if (!user) return ""
  const name = getDisplayName(user)
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function readSavedItemIds(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(SAVED_ITEMS_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [savedItemIds, setSavedItemIds] = useState<string[]>([])

  const refetchUser = async () => {
    if (!getAccessToken()) {
      setUser(null)
      return
    }
    try {
      const fetchedUser = await fetchCurrentUser()
      setUser(fetchedUser)
    } catch {
      setUser(null)
    }
  }

  useEffect(() => {
    refetchUser().finally(() => setIsLoading(false))
    setSavedItemIds(readSavedItemIds())
  }, [])

  const login = async (email: string, password: string) => {
    const result = await loginUser({ email, password })
    setUser(result.user)
  }

  const register = async (email: string, password: string) => {
    const result = await registerUser({ email, password })
    setUser(result.user)
  }

  const logout = async () => {
    await logoutUser()
    setUser(null)
  }

  const toggleSavedItem = (productId: string) => {
    setSavedItemIds((previous) => {
      const next = previous.includes(productId)
        ? previous.filter((id) => id !== productId)
        : [...previous, productId]
      window.localStorage.setItem(SAVED_ITEMS_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <UserContext.Provider
      value={{
        user,
        isLoggedIn: user !== null,
        isLoading,
        login,
        register,
        logout,
        refetchUser,
        savedItemIds,
        toggleSavedItem,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUser must be used within UserProvider")
  }
  return context
}
