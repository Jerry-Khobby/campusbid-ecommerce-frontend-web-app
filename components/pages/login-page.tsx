"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Mail, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useUser } from "@/lib/user-context";
import { useNotification } from "@/lib/notification-context";
import { ApiError } from "@/lib/api/client";
import { isStrongPassword } from "@/lib/password-rules";
import { PasswordRequirements } from "@/components/password-requirements";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/home";

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register, isLoggedIn, isLoading } = useUser();
  const { addNotification } = useNotification();

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace(redirectTo);
    }
  }, [isLoading, isLoggedIn, redirectTo, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addNotification("Enter your email and password", "error");
      return;
    }
    if (isSignUp && !isStrongPassword(password)) {
      addNotification("Your password doesn't meet all the requirements listed below it", "error");
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      addNotification("Passwords do not match", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await register(email, password);
        addNotification("Account created successfully!", "success");
      } else {
        await login(email, password);
        addNotification("Logged in successfully!", "success");
      }
      router.push(redirectTo);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Something went wrong, please try again";
      addNotification(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isLoggedIn) {
    return null;
  }

  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              CampusBid
            </h1>
            <p className="text-muted-foreground">
              {isSignUp ? "Create your account" : "Welcome back"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <PasswordInput
                  id="login-password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                  aria-describedby={isSignUp ? "password-requirements" : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
              {isSignUp && <PasswordRequirements id="password-requirements" password={password} />}
              {!isSignUp && (
                <div className="mt-2 text-right">
                  <Link
                    href="/forgot-password"
                    className="inline-block py-1 text-sm text-accent hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="login-confirm-password" className="block text-sm font-medium text-foreground mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    size={18}
                  />
                  <PasswordInput
                    id="login-confirm-password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-2"
            >
              {isSubmitting ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent flex items-center justify-center gap-2"
                onClick={() => {
                  window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/google`
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="py-1 text-accent font-semibold hover:underline"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>
      </Card>
    </main>
  );
}
