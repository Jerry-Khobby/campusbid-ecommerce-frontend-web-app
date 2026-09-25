# CampusBid — Customer App

The student-facing marketplace: browse campus vendors, buy products, bid on time-boxed flash sales, chat with vendors, pay through an escrow-style checkout, track orders, and manage a profile — all backed by the [CampusBid backend](../campus-bid-backend-web-app).

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · shadcn/ui (Radix primitives) · TanStack Query · Socket.IO client · Recharts · Vitest + Testing Library

## Getting started

```bash
npm install
cp .env.local.example .env.local   # point NEXT_PUBLIC_API_BASE_URL at your backend
npm run dev                        # http://localhost:5000
```

The backend must be running and reachable at `NEXT_PUBLIC_API_BASE_URL` — this app makes no server-side API calls of its own; every data fetch and mutation goes through the browser to the backend's REST API (`{base}/api/...`) or its `/chat` and `/notifications` Socket.IO namespaces (note: no `/api` prefix on the socket URL — see the comment in `.env.local.example`).

```bash
npm test        # vitest run — unit/component tests
npm run lint    # eslint
npm run build   # production build
```

## App structure

Routes live under `app/`, one folder per top-level page; most page components are implemented in `components/pages/*.tsx` and just mounted by the route file, which keeps route files thin and the actual UI logic colocated and independently readable.

| Route | Purpose |
| --- | --- |
| `/home` | Browse vendors/products by category |
| `/search` | Text search across products and vendors |
| `/product/[id]` | Product detail |
| `/flash-sales` | Live bidding-style flash sales |
| `/cart`, `/checkout` | Cart and checkout, hands off to Paystack |
| `/payments/callback` | Paystack redirects here after payment; polls the payment status until it resolves |
| `/orders` | Order list, status timeline, cancel, confirm-delivery, dispute/refund |
| `/chat` | Buyer↔vendor messaging (predefined + free-text messages) |
| `/profile` | Account, addresses, saved items, payment methods, notifications, settings |
| `/login`, `/forgot-password`, `/reset-password`, `/auth/google` | Auth (email/password + Google OAuth) |

`lib/api/*.ts` is one file per backend resource (`orders.ts`, `payments.ts`, `products.ts`, etc.), each exporting plain `apiFetch` wrappers plus the TanStack Query hooks that consume them — that pairing is the project's convention, so a new integration should add both in the same file rather than hooks in components.

## Conventions worth knowing before changing things

- **Auth**: JWT access + refresh tokens in `lib/api/token-storage.ts` (`localStorage`, never touched outside that file). `lib/api/client.ts`'s `apiFetch` retries exactly once on a 401 by calling `/api/users/refresh`, then clears tokens if that also fails. `useRequireAuth` (in `hooks/`) gates protected pages — it waits on `UserProvider`'s `isLoading` flag before redirecting, because child-component effects fire before the parent's on mount and an early check would otherwise race the session restore and bounce a logged-in user to `/login`.
- **Real-time**: `components/notifications-socket-bridge.tsx`, mounted once in `app/layout.tsx`, keeps the notification bell (`components/notification-bell.tsx`, visible on every page) and toast feed live without polling. Chat has its own socket wiring in `lib/socket/`.
- **No free-text policy on flash-sale bidding, but chat does allow free text** — don't conflate the two message-sending paths if extending either.
- **Escrow model**: a payment is held after checkout and only released to the vendor when the customer confirms delivery (`/orders`), or refunded if they dispute a delivered order instead. The UI reflects payment state, not just order state — check both when debugging a stuck order.

## Known gotchas

- **`next.config.mjs` sets `typescript.ignoreBuildErrors: true`.** A production build will succeed even with type errors — `npm run build` is not a type-safety gate here. Run `npx tsc --noEmit` explicitly before shipping, especially since CI (if you add one) won't catch this otherwise.
- **Test coverage is intentionally partial, not comprehensive.** Vitest is wired up and covers the payment-dispute flow and the order-status timeline (the two newest, previously-untested features) — most of the app has no tests yet. Treat the existing tests as the pattern to extend, not as proof the app is fully covered.
- **`images.unoptimized: true`** in `next.config.mjs` — Next's image optimization is off, likely because product/vendor images come from Cloudinary already. Revisit if you self-host images without a CDN in front.
