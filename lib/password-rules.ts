// Mirrors the backend's IsStrongPassword options on sign-up, reset and change
// password (campus-bid-backend-web-app/src/modules/users/dto/*.dto.ts), so a
// password that passes here isn't rejected after the round trip.
export const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (password: string) => password.length >= 8 },
  { label: "An uppercase letter", test: (password: string) => /[A-Z]/.test(password) },
  { label: "A lowercase letter", test: (password: string) => /[a-z]/.test(password) },
  { label: "A number", test: (password: string) => /\d/.test(password) },
  { label: "A symbol (e.g. ! @ # $)", test: (password: string) => /[^A-Za-z0-9]/.test(password) },
] as const

export function isStrongPassword(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password))
}
