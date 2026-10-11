"use client"
import { usePathname, useRouter } from "next/navigation"
import { useCart } from "@/lib/cart-context"
import { useUser } from "@/lib/user-context"
import { useNotification } from "@/lib/notification-context"

export default function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { itemCount } = useCart()
  const { isLoggedIn } = useUser()
  const { addNotification } = useNotification()

  if (pathname === "/login" || pathname?.startsWith("/vendor")) {
    return null
  }

  const handleProtectedNavigation = (path: string) => {
    if (!isLoggedIn && (path === "/profile" || path === "/chat" || path === "/orders")) {
      addNotification("Please log in to continue", "info")
      router.push("/login")
    } else {
      router.push(path)
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
      <div className="flex justify-around items-center h-16 md:h-20 max-w-7xl mx-auto px-2">
        <NavButton
          icon="🏠"
          label="Home"
          active={pathname === "/home" || pathname === "/"}
          onClick={() => router.push("/home")}
        />
        <NavButton icon="🔍" label="Search" active={pathname === "/search"} onClick={() => router.push("/search")} />
        <NavButton
          icon="⚡"
          label="Sales"
          active={pathname === "/flash-sales"}
          onClick={() => router.push("/flash-sales")}
        />
        <NavButton
          icon="💬"
          label="Chat"
          active={pathname === "/chat"}
          onClick={() => handleProtectedNavigation("/chat")}
        />
        <NavButton
          icon="🛒"
          label="Cart"
          badge={itemCount > 0 ? itemCount : undefined}
          active={pathname === "/cart"}
          onClick={() => router.push("/cart")}
        />
        <NavButton
          icon="📦"
          label="Orders"
          active={pathname === "/orders"}
          onClick={() => handleProtectedNavigation("/orders")}
        />
        <NavButton
          icon="👤"
          label="Profile"
          active={pathname === "/profile"}
          onClick={() => handleProtectedNavigation("/profile")}
        />
      </div>
    </nav>
  )
}

function NavButton({
  icon,
  label,
  active,
  badge,
  onClick,
}: {
  icon: string
  label: string
  active: boolean
  badge?: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center justify-center gap-0.5 md:gap-1 py-2 px-2 md:px-3 transition-colors relative min-w-0 ${
        active ? "text-accent" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <div className="relative text-xl md:text-2xl" aria-hidden="true">
        {icon}
        {badge && (
          <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full min-w-4 h-4 md:min-w-5 md:h-5 px-1 flex items-center justify-center">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] md:text-xs font-medium truncate max-w-full">
        {label}
        {badge ? <span className="sr-only"> ({badge})</span> : null}
      </span>
    </button>
  )
}
