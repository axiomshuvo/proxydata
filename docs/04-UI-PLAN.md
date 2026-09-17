# ProxyData — UI Implementation Plan

## Overview

This document outlines the phased strategy for building the ProxyData user interface. Following the "UI-First" approach, we will install the complete frontend stack, build the layout shells, and create a fully interactive (but mock-data driven) UI before wiring up the complex backend business logic and DataImpulse API integrations.

**Core UI Stack (LOCKED at init, exact versions in package.json + lockfile)**: Next 16 (App Router, `proxy.ts` — NOT `middleware.ts`), React 19, Tailwind v4 (CSS-first `@theme`; NO `tailwind.config.ts`), HeroUI v3 (no Provider wrapper), Zod (validation inside Server Actions; `react-hook-form` only for excessively dynamic forms). Package versions are locked at scaffolding; upgrades via ADR.

## Phase 1: Stack Installation & Theming

### 1.1 Initialization

- Scaffold Next.js 16 with App Router and Tailwind v4 (CSS-first; theme in `app/globals.css` via `@theme`, no `tailwind.config.ts`).
- Install HeroUI v3 (`@heroui/react`). **Note: HeroUI v3 does NOT require a Provider wrapper** — components work directly without wrapping the root layout.
- Install `@gravity-ui/icons` to match HeroUI's native aesthetic perfectly.
- Use native React 19 hooks (`useActionState`, `useFormStatus`) for form state management.
- Install `zod` for server-side validation inside Server Actions.
- Setup HeroUI v3's native Toast API (verify exact import against v3 docs at heroui.com; pin working import in a `lib/toast.ts` wrapper so a HeroUI minor change touches one file) for global notifications.

### 1.2 Design System & Theming

- Define brand colors (Primary, Secondary, Success, Warning, Danger) in CSS-first `@theme` tokens in `app/globals.css` (Tailwind v4 — no `tailwind.config.ts`).
- Set up global CSS for typography and mobile-first reset.
- Create theme utility classes for reusable spacing, shadows, and rounded corners to match a modern, premium aesthetic.
- Provider brand assets (LOCKED): official DataImpulse logo SVG at `public/providers/dataimpulse.svg` (+ dark variant + favicon), consumed ONLY from this path by plan cards/provider strip. No redesigns, no hotlinked CDN copies.

### 1.3 PWA Setup

- Configure Serwist (`@serwist/next`) for offline caching of the app shell and static assets ONLY. `NetworkOnly` (never precache) for: `/api/*`, `/dashboard`, `/proxy-config`, `/transactions`, `/redeem`, auth routes. Proxy credentials must never land in CacheStorage.
- Generate `manifest.json` with appropriate theme colors, standalone display mode, and icon assets.
- Setup service worker to ensure the shell loads offline.

---

## Phase 2: Core Layouts & Navigation Shells

### 2.1 Public & Auth Layouts

- **Target Routes**: `/` (Homepage), `/user/sign-in`, `/user/sign-up`, `/user/forgot-password`, `/user/reset-password`, `/privacy-policy`, `/terms`, `/contact`
- **Structure (Public Pages)**: Modern, SEO-optimized landing page layout with a global header (Logo, Navigation links, "Login" CTA) and a rich footer (Links to TOS, Privacy, Contact).
- **Structure (Auth)**: Clean, centered card layout on desktop; full-width stacked layout on mobile, utilizing the same global header.
- **Components**: Brand Logo header, Hero section (for Homepage), standard prose typography for legal pages, HeroUI Inputs for Contact/Auth forms.

### 2.2 Customer App Layout (Mobile-First)

- **Target Routes**: `/dashboard`, `/plans`, `/checkout`, `/proxy-config`, `/transactions`, `/redeem`, `/affiliate`, `/profile`
- **Mobile View**:
  - Sticky Top Navbar (Logo, Notifications icon, Profile Avatar).
  - Fixed Bottom Navigation Bar (Dashboard, Plans, Proxy, More). **More** drawer holds Transactions, Redeem, Affiliate (gated), Profile — no route is reachable only by URL typing.
- **Desktop View**:
  - Left-aligned Sidebar Navigation containing ALL links (same set as mobile incl. Transactions/Redeem/Affiliate).
  - Top header for breadcrumbs and user profile actions.

### 2.3 Admin Portal Layout

- **Target Routes**: `/axiomshuvo/*` (Derived from server configuration) (Obscured admin path for security)
- **Structure**: High-density desktop-optimized dashboard.
- **Components**: Collapsible sidebar, metrics summary header, wide data tables.

---

## Phase 3: UI Construction (Mock Data)

### 3.1 Public Marketing & Legal Pages

- **Homepage (`/`)**: Hero section with clear value proposition, "Supported Providers" logo strip (featuring DataImpulse), Feature grid (e.g., "Instant Activation", "Mobile-First"), and a Call-to-Action to Register.
- **Contact Page (`/contact`)**: Name/Email/Message via HeroUI inputs + support email/links. Throttled (3/hr/IP), CAPTCHA-gated, stored as support tickets (never executed/rendered as HTML — XSS-safe rendering only).
- **Profile (`/profile`)**: avatar upload constrained (image/*, ≤2 MB, server-side type + dimension check, served from object storage — NOT `public/uploads`); OAuth users get “Set Password”, credential users get “Change Password” (current-password required).
- **Legal Pages (`/privacy-policy`, `/terms`)**: Clean, highly readable text layouts using Tailwind v4-compatible typography (`@tailwindcss/typography` v0.5.16+ via `@plugin` in CSS — no v3-style config plugin).
- **Auth Pages (`/user/sign-in`, `/user/sign-up`, `/user/forgot-password`, `/user/reset-password`)**: Card-based authentication forms with validation feedback, including UI flows for requesting and entering password reset links/tokens for password resets. LINK-ONLY (single-use expiring token URL) — no numeric OTP codes anywhere, matching PRD §8.1 and the `verification_tokens` model.

In this phase, we build the actual pages using hardcoded mock data to perfect the interactions and responsive design.

### 3.2 Overview Dashboard (`/dashboard`)

- **Bandwidth Consumption Card**: A circular progress ring (using HeroUI `CircularProgress`) showing Purchased GB vs Remaining GB from the TTL-cached snapshot (with `lastBalanceSyncAt` “updated Xm ago” label and manual refresh button honoring the 5-min hot TTL — never a live upstream call per render).
- **Daily Usage Chart**: A bar chart of `usage-stat/get` history.
- **Active Plans Chips**: one chip per locked pool type held (`Residential`, `Mobile`, `Datacenter`, `Premium Residential`) with per-type remaining.
- **Threads/Capacity Note**: surface `threads_used` vs plan threads where relevant.
- **Quick Action Grid**: Large, tap-friendly buttons for "Buy Data", "Configure Proxy", and "Redeem Code".

### 3.3 Transaction Ledger (`/transactions`)

- **History Table**: A clear, sortable ledger showing all user activities (`PURCHASE`, `REDEEM`, `ADMIN_ADJUSTMENT`), including exact discount applied, TrxID, and final amount.

### 3.4 Plan Catalog & Checkout (`/plans` & `/checkout`)

- **Plan Cards**: Display plan name, pool type (4 pools), GB, crossed-out original price (if Offer active), and promotional price. DataImpulse logo from `public/providers/dataimpulse.svg` ONLY (no redesigns, §1.2). Out-of-stock plans (insufficient reseller balance after coefficients) render disabled with “Restocking” state — never purchasable.
- **Redeem Code Page (`/redeem`)**: CANONICAL single route. The plans-page entry is a shortcut button linking to `/redeem` (same Server Action, single validation path — no duplicate modal logic).
- **Checkout Modal/Page** (preview is advisory; server recomputes at submit AND approval):
  - Provider & Proxy Type summary (+ pool coefficient note, e.g. “Mobile uses 2x reseller balance”).
  - Target-filter picker with explicit “2x bandwidth” surcharge line when state/city/ZIP/ASN-include selected (1x on premium).
  - Coupon code input with "Apply" (preview). Affiliate code field: recorded for analytics, INERT — no price effect, no attribution change (PRD §12.3).
  - Cost breakdown (Subtotal, Discount source, Final Total).
  - Manual Payment Instructions block (bKash/Nagad details).
  - Transaction Reference Input (TrxID + Sender Number; duplicate-TrxID submits are rejected `409` with guidance).

### 3.5 Proxy Configuration Generator (`/proxy-config`)

- **Tabs**: Switch between purchased proxy types (Residential / Mobile / Datacenter / Premium Residential); unentitled tabs locked with upsell copy (backend still `403`s).
- **Mode Toggle**: Rotating (HTTP `:823` / SOCKS5 `:824`) vs Sticky (`:10000–20000` from `sticky_range`); ports rendered from server env, never hardcoded in components.
- **IP Whitelisting Manager**: add/remove IPs (max 5 per sub-user). MOVE semantics enforced: binding an IP already on another of the user's sub-users moves it (confirm dialog citing the upstream global-uniqueness rule) — copy attempts surface the exact error. IPv4/IPv6 validated, private/loopback rejected client AND server.
- **Protocol Toggle**: HTTP vs SOCKS5, limited to the sub-user's live `supported-protocols/get` set.
- **Form Controls**: Country `Select` (cached list + `pool_stats` counts); searchable Combobox for ASN; State/City/ZIP inputs (require country first; carry the 2x warning); `exclude_asn` labeled EXCLUDE with helper copy (“traffic NOT from these networks”); Threads number input (plan-capped); Rotation interval + Anonymous filter where applicable.
- **NO_RAY State**: `400 NO_RAY` renders “No IPs for this filter — try another city/ASN” with one-tap filter reset; the failed attempt is logged, never cached as config.
- **Output Box**:
  - Password MASKED by default with reveal-once (audited) + per-part copy (Endpoint / Credentials / Full string / cURL).
  - "Copy to Clipboard" buttons with toast feedback; full string never pre-rendered into the DOM while masked.
  - Targeting suffixes use ONLY the canonical grammar (`03` §6 — e.g. `login__cr.de;city.berlin`); the string is composed server-side and returned on explicit Generate/Copy action.

---

## Phase 4: Admin & Affiliate UIs

### 4.1 Affiliate Dashboard (`/affiliate`)

- **Stats Row**: Total Referrals, Total Earned, Unpaid Balance.
- **Referral Code Manager**: Input to generate new custom code (≤8 chars, throttled 3/day, max 5 active — server-enforced per PRD §12.2), list of active codes with "Copy" and "Disable" buttons (disabled codes shown struck-through, never reusable).
- **History Table**: List of qualifying transactions and earned commissions.

### 4.2 Admin Dashboard (`/axiomshuvo`)

- **Executive Overview**: HeroUI `Card` components showing total users, monthly revenue, total provider balance.
- **User & Affiliate Tables**: HeroUI `Table` with robust search specifically targeting `email` and `publicUserId`. (Suspend/Restore, Rotate Credentials, View Ledger, Upgrade to Affiliate, Soft Delete, Hard Deprovision) mirroring the §01-9.3 locked sequences (destructive actions dual-confirmed).
- **Purchase Approval Queue**: `PENDING` rows showing TrxID + Sender Number + amount for manual verification, PLUS server-computed cost basis (`providerCostBdt` with coefficients), margin, and commission preview (incl. floor-capped ৳0 cases). Duplicate/suspect-TrxID warning is blocking (approve disabled until resolved or explicitly overridden with reason). Quick "Approve/Reject" buttons must trigger detailed Toasts containing the `publicUserId`, `email`, and package details upon success. Approve triggers the worker pipeline (never synchronous allocation in the click handler); `FAILED` rows show error + evidence + single “Retry allocation” button (same idempotency key). Reject requires a mandatory reason (dropdown + note) which fires the user notification (in-app; email only within the `01` §32 allowlist).
- **Coupon/Offer Manager**: Forms with date pickers, discount type toggles, `%` caps (`maxDiscountAmount`), plan/user targeting, `usageLimit`/`isOneTime` flags, and per-coupon usage history drawer (from `coupon_usages`).
- **Affiliate Payout Manager**: `UNPAID` → `PARTIALLY_PAID` → `PAID` ledger with overpay guard (payout amount never exceeds unpaid sum — enforced in-transaction); receipt/screenshot upload (image only, ≤5 MB); reference note required; affiliate notified in-app notification only (strict email quota).
- **System Settings Configuration**: exact keys ONLY — `pendingRequestExpiryDays` (default 7), `affiliateMaxActiveCodes` (5), `defaultCommissionPerGbBdt`, `minimumOwnerProfitBdt`, wholesale `costPerGbBdt` per pool. No free-form env editing from UI; `ADMIN_PATH` never appears here.

---

## Phase 5: Interactivity & Form State (React 19 Best Practices)

Before touching the backend database, we ensure the UI _feels_ complete using the latest React 19 / Next.js 16 conventions:

- **Server Actions First**: Use native `<form action={submitAction}>` instead of heavy client-side form libraries where possible.
- **Form State**: Wire up React 19's `useActionState` and `useFormStatus` to handle pending states and show loading spinners (e.g., HeroUI `Button isLoading={pending}`).
- **Validation**: Use Zod strictly inside the Server Actions to validate `FormData` and return structured error objects to the client. (Use `react-hook-form` only if a form becomes excessively dynamic or complex).
- **Feedback**: Implement global toast notifications using HeroUI's built-in `addToast` for success/error states (e.g., "Copied to clipboard!", "Invalid TrxID", "Order pending approval").
- Ensure all Modals, Drawers, and Dropdowns open and close smoothly.

## Summary of Execution Order

1. **Initialize Next.js + HeroUI** (Empty shells).
2. **Build Navigation** (Bottom bar for mobile, sidebar for desktop).
3. **Build Static Pages** (Login, Dashboard, Plans, Proxy Config) with mock data.
4. **Build Admin Pages** with mock data.
5. **Add Form Interactivity** (React 19 `useActionState` + Server Actions).
6. **Stop & Review UI** with stakeholders before connecting the MongoDB backend or DataImpulse API.
