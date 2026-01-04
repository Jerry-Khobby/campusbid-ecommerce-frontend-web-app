import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { OrdersProvider } from "@/lib/orders-context";
import { UserProvider } from "@/lib/user-context";
import { NotificationProvider } from "@/lib/notification-context";
import NotificationToast from "@/components/notification-toast";
import BottomNavigation from "@/components/bottom-navigation";
import MainContent from "@/components/main-content";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CampusBid - Campus Marketplace",
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
        <NotificationProvider>
          <UserProvider>
            <CartProvider>
              <OrdersProvider>
                <div className="flex flex-col h-screen bg-background">
                  <MainContent>{children}</MainContent>
                  <BottomNavigation />
                  <NotificationToast />
                </div>
              </OrdersProvider>
            </CartProvider>
          </UserProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}
