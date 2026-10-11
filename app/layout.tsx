import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { UserProvider } from "@/lib/user-context";
import { NotificationProvider } from "@/lib/notification-context";
import NotificationToast from "@/components/notification-toast";
import BottomNavigation from "@/components/bottom-navigation";
import MainContent from "@/components/main-content";
import { Providers } from "./providers";
import { NotificationsSocketBridge } from "@/components/notifications-socket-bridge";
import { NotificationBell } from "@/components/notification-bell";
import { ServerWakeBanner } from "@/components/server-wake-banner";

// Assigning to a const is required for Next's font-loader compiler plugin to
// pick this up; the objects themselves aren't used directly. This self-hosts
// the "Geist"/"Geist Mono" families that globals.css references by name in
// --font-sans/--font-mono.
const geistSans = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "CampusBid - Campus Marketplace",
    template: "%s · CampusBid",
  },
  description: "Buy and bid on items from campus vendors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <Providers>
          <NotificationProvider>
            <UserProvider>
              <CartProvider>
                <NotificationsSocketBridge />
                <div className="flex flex-col h-screen bg-background">
                  <NotificationBell />
                  <MainContent>{children}</MainContent>
                  <BottomNavigation />
                  <NotificationToast />
                  <ServerWakeBanner />
                </div>
              </CartProvider>
            </UserProvider>
          </NotificationProvider>
        </Providers>
      </body>
    </html>
  );
}
