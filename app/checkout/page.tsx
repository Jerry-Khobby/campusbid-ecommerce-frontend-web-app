"use client";

import CheckoutPage from "@/components/pages/checkout-page";
import { useUser } from "@/lib/user-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useNotification } from "@/lib/notification-context";

export default function Checkout() {
  const { isLoggedIn } = useUser();
  const router = useRouter();

  const { addNotification } = useNotification();

  useEffect(() => {
    if (!isLoggedIn) {
      addNotification("Please log in to checkout", "info");

      const params = new URLSearchParams();
      params.set("redirect", "/checkout");

      router.push(`/login?${params.toString()}`);
    }
  }, [isLoggedIn, router, addNotification]);

  if (!isLoggedIn) {
    return null;
  }

  return <CheckoutPage />;
}
