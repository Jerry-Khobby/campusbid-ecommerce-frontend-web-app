"use client"

import { Check, Circle } from "lucide-react"
import { PASSWORD_RULES } from "@/lib/password-rules"

/** Live checklist of the password rules, ticked off as the user types. */
export function PasswordRequirements({ password, id }: { password: string; id?: string }) {
  return (
    <ul id={id} className="mt-2 space-y-1 text-xs" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const isMet = rule.test(password)
        return (
          <li
            key={rule.label}
            className={`flex items-center gap-2 ${isMet ? "text-green-600" : "text-muted-foreground"}`}
          >
            {isMet ? <Check size={12} aria-hidden="true" /> : <Circle size={12} aria-hidden="true" />}
            <span>
              {rule.label}
              <span className="sr-only">{isMet ? " (done)" : " (missing)"}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
