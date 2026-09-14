import { apiFetch, apiUpload } from "./client"
import { clearTokens, setTokens } from "./token-storage"
import type { SafeUser } from "./types"

interface AuthResult {
  user: SafeUser
  accessToken: string
  refreshToken: string
}

export interface RegisterInput {
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

// Registration only sends the two required fields. `profile`/`addresses`/etc.
// are accepted by the backend's CreateUserDto but are all optional there —
// completing them goes through PUT /users/profile after registration, which
// avoids relying on multipart form-data's uncertain handling of nested JSON
// fields for a case where it isn't needed.
export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const formData = new FormData()
  formData.append("email", input.email)
  formData.append("password", input.password)
  // Required by CreateUserDto's validation but not read by the handler (see docs/users.md).
  formData.append("refreshToken", "n/a")

  const json = await apiUpload<{ user: SafeUser; accessToken: string; refreshToken: string }>(
    "/users/register",
    formData,
  )
  setTokens(json.accessToken, json.refreshToken)
  return json
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const json = await apiFetch<{ user: SafeUser; accessToken: string; refreshToken: string }>("/users/login", {
    method: "POST",
    body: input,
    auth: false,
  })
  setTokens(json.accessToken, json.refreshToken)
  return json
}

export async function logoutUser(): Promise<void> {
  try {
    await apiFetch("/users/logout", { method: "POST" })
  } finally {
    clearTokens()
  }
}

export async function fetchCurrentUser(): Promise<SafeUser> {
  const json = await apiFetch<{ user: SafeUser }>("/users/profile")
  return json.user
}

export async function requestPasswordReset(email: string): Promise<void> {
  // The backend's response also includes a raw resetToken (a known,
  // documented placeholder-for-production quirk) — intentionally ignored
  // here since the real reset link is meant to arrive by email.
  await apiFetch("/users/forgot-password", { method: "POST", body: { email }, auth: false })
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiFetch("/users/reset-password", { method: "POST", body: { token, newPassword }, auth: false })
}
