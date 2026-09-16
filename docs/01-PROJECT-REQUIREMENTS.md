# ProxyData — Project Requirements Document (PRD)

> **Document Status**: Active / Single Source of Truth
> **Version**: 1.1.2 (2026-09-17 — recheck pass 3: workplan reconciliation + targeting grammar; see `archive/05-PLAN-AUDIT.md` Recheck Log)
> **Target System**: ProxyData (Mobile-First Proxy Resale Platform)  
> **Initial Primary Upstream Provider**: DataImpulse  
> **Audit Status**: Live-verified 2026-09-17 against Postman collection + official docs (outcomes in §31; evidence in `archive/06-DATAIMPULSE-API-VERIFICATION.md`). Only sandbox confirmations in §28 remain open.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Business Model](#2-business-model)
3. [Goals](#3-goals)
4. [Scope](#4-scope)
5. [Technology Stack](#5-technology-stack)
6. [Architecture Direction](#6-architecture-direction)
7. [Roles and Permissions](#7-roles-and-permissions)
8. [Authentication](#8-authentication)
9. [Owner/Admin Requirements](#9-owneradmin-requirements)
10. [Reseller/Provider Requirements](#10-resellerprovider-requirements)
11. [User Requirements](#11-user-requirements)
12. [Affiliate Requirements](#12-affiliate-requirements)
13. [Plans](#13-plans)
14. [Pricing](#14-pricing)
15. [Offers and Coupons](#15-offers-and-coupons)
16. [Purchase Flow](#16-purchase-flow)
17. [Redeem Flow](#17-redeem-flow)
18. [Proxy Entitlement](#18-proxy-entitlement)
19. [Proxy Configuration](#19-proxy-configuration)
20. [Data / GB Tracking](#20-data--gb-tracking)
21. [Transactions](#21-transactions)
22. [Notifications](#22-notifications)
23. [PWA / UI Requirements](#23-pwa--ui-requirements)
24. [Security Requirements](#24-security-requirements)
25. [Audit Logging](#25-audit-logging)
26. [DataImpulse Dependencies](#26-dataimpulse-dependencies)
27. [Assumptions](#27-assumptions)
28. [Open Questions](#28-open-questions)
29. [Future Features](#29-future-features)
30. [Acceptance-Level Business Rules](#30-acceptance-level-business-rules)
31. [Live-Verified Audit Outcomes](#31-live-verified-audit-outcomes-replaces-pending_api_audit-table--2026-09-17)

---

## 1. Project Overview

**ProxyData** is a mobile-first web application designed for reselling proxy and data bandwidth services. It operates as a modern digital storefront and management portal where end-users can purchase bandwidth (GB) for specific proxy types, manage their proxy credentials, and generate client configurations.

> [!NOTE]
> The upstream provider (DataImpulse) supports four proxy pool types: **Residential**, **Mobile**, **Datacenter**, and **Premium Residential** (live-verified 2026-09-17; coefficients ×1.0 / ×2.0 / ×0.5 / ×5.0 — see §10.2).

The platform initiates operations by reselling services upstream from **DataImpulse** via a master reseller account and the DataImpulse API. The entire system is architected around a **Provider-Agnostic Abstraction Layer**, ensuring that DataImpulse is treated as an implementation of a generic upstream provider interface rather than hard-coded into domain models or application flows. Additional proxy providers can be integrated in subsequent phases without altering core business logic or customer-facing structures.

---

### 1.1 DataImpulse Branding Requirement

- Use the official DataImpulse company name.
- Use the official DataImpulse logo in the provider UI/card where appropriate.
- Use the official DataImpulse favicon where appropriate.
- Do not invent or redesign the provider logo.

## 2. Business Model

1. **Wholesale to Retail Bandwidth Arbitrage**:
   - ProxyData procures bulk proxy data/bandwidth pools upstream from DataImpulse at wholesale rates.
   - Bandwidth is packaged into discrete plans (e.g., 1 GB, 2 GB, 5 GB, 10 GB) and sold to retail end-users at defined markups in local currency (BDT).
2. **Reseller Margin & Financial Visibility**:
   - The platform calculates margins, estimated revenue, and estimated profits by comparing purchase cost (either tracked via upstream API or manually input by the Owner/Admin) with retail sale price.
3. **Manual Payment Onboarding**:
   - In the initial release, payment processing is strictly **manual** (e.g., direct mobile financial service / bank transfer verification by the Owner/Admin).
   - Once payment is confirmed offline, the Owner approves the purchase request in the admin portal, triggering worker-driven upstream allocation (`POST .../balance/add` + `balance/get` confirmation, §16.2).
   - The architecture is explicitly decoupled from payment capture mechanisms to allow seamless drop-in integration of automated payment gateways later.
4. **Growth via Affiliate Referrals**:
   - Verified users can be promoted to Affiliates.
   - Affiliates generate referral codes, circulate them to prospective buyers, and earn tiered or flat per-plan commissions upon successful, activated customer transactions.
   - Payouts are reconciled on a calendar-month cadence or manually settled by the Owner.
5. **Promotions & Gift Redemption**:
   - The Owner generates internal, single-use, cryptographically secure redeem codes representing specific plan allowances (e.g., 5 GB of an entitled proxy type) for marketing campaigns, customer support compensations, or direct off-platform bulk sales.

---

## 3. Goals

### 3.1 Primary Business Goals

- Establish a reliable, mobile-optimized proxy purchasing portal tailored for users in regions primarily browsing on smartphones.
- Maximize inventory transparency and prevent overselling through authoritative balance synchronization.
- Provide end-to-end auditability for manual financial transactions, preventing double-allocations or unverified credit granting.
- Incentivize customer acquisition through a multi-code affiliate program.

### 3.2 Primary Technical Goals

- Deliver a unified Next.js monolithic codebase with clear service abstractions and zero duplicated validation logic.
- Enforce strict server-side validation for all pricing, discount, eligibility, proxy entitlement, and provisioning operations.
- Ensure DataImpulse credentials and secrets must never be exposed to browser/client code, public API responses, client logs, or client-side environment variables.
- Support Progressive Web App (PWA) installation to offer an app-like mobile experience.
- Maintain soft-deletion and append-only audit histories to ensure data integrity and traceability.

---

## 4. Scope

### 4.1 In-Scope (Initial Release)

- **Authentication & Profiles**:
  - Better Auth implementation (Email/Password, Google OAuth).
  - Password setting for OAuth users lacking local credentials.
  - Password reset flows via email.
  - Collision-resistant, user-friendly internal User ID generation.
  - User profile viewing with immutable email restriction.
- **Provider Abstraction**:
  - Abstract Provider Interface (`IProxyProvider`).
  - DataImpulse upstream implementation adapter (`DataImpulseProvider`).
  - Provider inventory/balance visualization and manual cost override interface.
  - Centralized provider metadata caching (countries + per-country pool counts).
- **Plan & Pricing Engine**:
  - CRUD operations for bandwidth plans (integer GB, locked 4-pool proxy type, price in BDT, status).
  - Offer & coupon engine with plan-specific constraints, percentage/flat discounts, and server-side calculation.
- **Purchase Workflow (Manual Payment)**:
  - User checkout workflow: Provider -> Proxy Type -> GB Selection -> Price Summary -> Request Submission.
  - Owner/Admin approval queue: Review -> Approve -> Worker-Driven Provider Allocation (idempotent) -> Activation.
  - Configurable expiration timer for stale unapproved requests (default: exactly 7 days UTC).
- **Redeem Code Engine**:
  - Owner generation of internal multi-attribute redeem codes.
  - Atomic, idempotent single-use redemption with concurrency protection and transactional safety (`GENERATED → ACTIVE → PROCESSING → PROVIDER_ALLOCATED → USED`, §17).
- **Proxy Management & Entitlement**:
  - Strict server-side type-isolation across the locked 4 pools (`RESIDENTIAL | MOBILE | DATACENTER | PREMIUM_RESIDENTIAL`).
  - Mobile-first Proxy Configuration generator (Country, State/City/ZIP/ASN with 2x-billing warning, IP:Port, credentials) with single-click copy tools.
  - Latest configuration persistence (overwrites previous state; defaults when unset).
- **Data & Bandwidth Synchronization**:
  - Distinction maintained: Purchased GB = locally recorded purchase entitlement; Remaining GB = provider-authoritative balance via `balance/get` (cached with short TTL).
  - Allocation recording and remaining quota calculations.
- **Affiliate Program**:
  - Admin upgrade/invite activation for existing accounts.
  - Multi-code management: affiliates may actively use multiple of their own active codes simultaneously up to a configurable limit (default: 5 active codes).
  - Globally unique codes (≤ 8 alphanumeric characters; high-entropy redeem codes are the separate ≥12-char instrument in §17).
  - Code lifecycle management: create, delete/deactivate, no code reuse/reassignment, historical code retention.
  - First-touch stable referral attribution.
  - Per-affiliate configurable commission rates.
  - Manual payout ledger with calendar-month reconciliation, partial payments, and payment proof attachments.
- **Owner/Admin Dashboard**:
  - Comprehensive real-time metrics (users, sales, remaining data, provider balances, financial summaries).
  - User management (suspension/reinstatement, detailed transaction inspect, soft deletion).
  - Configurable, obscured admin route path.
- **PWA & Mobile UI**:
  - Tailwind CSS + HeroUI mobile-first layout.
  - Dynamic PWA installation prompt handling.
  - Persistent bottom/drawer mobile navigation.
  - In-app notification feed for transaction and account lifecycle events.

### 4.2 Out-of-Scope (Deferred to Future Releases)

- Automated payment gateway integration (bKash, Nagad, Stripe, SSLCommerz).
- Upstream providers other than DataImpulse (infrastructure must support them, but none implemented initially).
- Two-Factor Authentication (2FA / TOTP).
- Granular Role-Based Access Control (RBAC) with staff/moderator tiers (strictly single Owner/Admin initially).
- Historical versioning of proxy configurations (only the latest configuration is stored).
- Native iOS/Android mobile apps (PWA fulfills mobile requirements).
- Automated affiliate payout execution (payouts remain manual ledger operations).

---

## 5. Technology Stack

| Layer                 | Technology                             | Selection Justification                                                                                                    |
| :-------------------- | :------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **Framework**         | **Next.js 16 (App Router)**            | Monolithic efficiency, Server Components, Route Handlers, and Server Actions for unified backend logic.                    |
| **Frontend Library**  | **React 19**                           | Component-driven declarative UI with concurrent rendering.                                                                 |
| **Styling**           | **Tailwind CSS v4 (CSS-first `@theme`)**   | Utility-first, mobile-first responsive styling. No `tailwind.config.ts` — theme lives in CSS per v4.                     |
| **Component System**  | **HeroUI v3**                              | Modern, accessible, mobile-optimized UI component suite designed for React & Tailwind. No Provider wrapper (v3).          |
| **Authentication**    | **Better Auth**                        | Modern, flexible TypeScript auth framework supporting credentials, Google OAuth, session management, and extensible hooks. |
| **Database**          | **MongoDB (Native Driver + Zod)** | Document model aligns naturally with nested plans, provider payloads, and audit logs.                                      |
| **PWA Engine**        | **@serwist/next**                      | Standards-compliant service worker management, manifest generation, and offline caching.                                   |
| **Form & Validation** | **Zod + React Hook Form**              | Shared client/server validation schemas guaranteeing zero discrepancy in business rules.                                   |
| **Icons**             | **@gravity-ui/icons**                  | Matches HeroUI v3's native icon aesthetic (same stroke weight, corner radius) for a visually consistent UI.                |

---

## 6. Architecture Direction

### 6.1 Unified Monolith Pattern

ProxyData is structured as a **cohesive Next.js monolith**. Backend services, background validation, domain models, and frontend layouts reside within a single codebase. Express or separate microservices are strictly avoided at this stage to minimize operational overhead, eliminate network serialization latency, and keep deployment workflows straightforward.

```
┌─────────────────────────────────────────────────────────────┐
│                    ProxyData Client (PWA)                   │
│   Mobile-First UI · HeroUI · Tailwind · Service Worker      │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON
┌──────────────────────────────▼──────────────────────────────┐
│                  Next.js Application Layer                  │
│  App Router · Route Handlers · Server Actions · proxy.ts     │
├─────────────────────────────────────────────────────────────┤
│                    Domain Services Layer                    │
│  ┌─────────────────┐ ┌──────────────────┐ ┌──────────────┐  │
│  │   Auth Service  │ │  Pricing Engine  │ │ Promo Engine │  │
│  └─────────────────┘ └──────────────────┘ └──────────────┘  │
│  ┌─────────────────┐ ┌──────────────────┐ ┌──────────────┐  │
│  │ Purchase Service│ │ Affiliate Service│ │ Audit Service│  │
│  └─────────────────┘ └──────────────────┘ └──────────────┘  │
├─────────────────────────────────────────────────────────────┤
│              Provider Abstraction Layer (PAL)               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              IProxyProvider (Interface)               │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
│              ┌───────────────┴───────────────┐              │
│              ▼                               ▼              │
│     DataImpulseProviderAdapter         [Future Providers]      │
├─────────────────────────────────────────────────────────────┤
│                      Persistence Layer                      │
│        MongoDB Native Driver / Aggregation Pipelines        │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Architectural Principles

1. **Single Source of Business Truth**:
   - Pricing calculations, status validation, and entitlement checks are strictly housed in server-side domain services (`lib/services/*`). UI components invoke these services and never calculate final figures independently.
2. **Provider Decoupling via Abstraction**:
   - All external provider communication passes through the `IProxyProvider` interface. The core platform knows nothing of DataImpulse HTTP quirks, headers, or field formats.
3. **Optimized I/O & Centralized Caching**:
   - High-frequency provider metadata (country lists + pool counts) is cached in MongoDB with a scheduled background refresh (hourly single-leader cron, upsert). Individual end-user requests query local MongoDB caches rather than hammering upstream APIs.
4. **Idempotency & Concurrency Safety**:
   - Redeem operations and purchase approval transitions use atomic MongoDB updates (`findOneAndUpdate` with pre-condition queries) to prevent race conditions and duplicate provisioning.
5. **Fail-Closed Security Posture**:
   - If an upstream allocation call fails or times out, the purchase request is marked `FAILED` or held in `ALLOCATING`. Bandwidth is never credited to the user until authoritative upstream confirmation is received.

---

## 7. Roles and Permissions

### 7.1 Role Definitions

The platform recognizes two core identity roles, plus a functional account capability:

1. **Owner/Admin (`ROLE_ADMIN`)**:
   - Unrestricted operational and administrative authority.
   - Access to the obscured administrative portal.
   - Capability to manage providers, review/approve/reject purchase requests, generate redeem codes, configure plans/discounts, inspect/suspend users, and manage affiliate commissions and payouts.
   - _Design Constraint_: Exactly one primary Owner account exists initially. No complex multi-tier staff hierarchies are introduced, but role checks rely on structured role constants to allow future RBAC expansion.
2. **Normal User (`ROLE_USER`)**:
   - Authenticated consumer.
   - Access to customer dashboard, plan catalog, checkout request submission, redeem code entry, proxy credential viewing, proxy configuration generator, and transaction history.
3. **Affiliate User (`CAPABILITY_AFFILIATE`)**:
   - An augmented capability granted to an existing `ROLE_USER`.
   - Affiliates retain all normal user privileges while gaining access to the Affiliate Portal (referral codes, conversion analytics, referral transaction logs, earnings, and payout tracking).
   - Affiliates **do not** have a separate login credential or user table.

### 7.2 Account Status States

Every account maintains an explicit `status` field:

- **`ACTIVE`**: Unrestricted access to all eligible features.
- **`SUSPENDED`**:
  - The user may still log in and view historical transactions, existing profile information, and support instructions in a strictly **read-only** state.
  - The user is **strictly blocked** from:
    1. Submitting new purchase requests.
    2. Redeeming codes.
    3. Accessing proxy configuration generators.
    4. Viewing active proxy credentials or consuming proxy entitlements.
    5. Generating new affiliate codes or accruing commissions.
- **`DEACTIVATED` (Soft-Deleted)**:
  - Account disabled. Cannot log in. Historical records and audit logs are retained.

---

## 8. Authentication

### 8.1 Engine & Protocols

Authentication is implemented via **Better Auth** using **secure cookie-based sessions** stored in HTTP-only cookies. Better Auth's JWT plugin is only used if a specific JWT use case arises (e.g., third-party API token issuance). The default and primary session model is cookie-based. Route protection uses Next.js 16 `proxy.ts` (not legacy `middleware.ts`) terminology.

- **Supported Methods**:
  1. Standard Email and Password. Password hashing uses **Better Auth's secure default (scrypt)**. No custom crypto; no algorithm downgrade without an ADR.
  2. Google OAuth 2.0 (Single Sign-On).
- **Password Reset Flow**:
  - Secure, time-limited, cryptographically random reset tokens dispatched via email.
  - Link directs to `/user/reset-password?token=XYZ`.
- **Hybrid Credential Handling**:
  - Users who register via Google OAuth do not possess a local password.
  - The profile interface must provide a "Set Password" option allowing OAuth users to establish a local password without requiring an existing password challenge.
  - Users with existing passwords use a standard "Change Password" flow requiring current password verification.
- **Two-Factor Authentication (2FA)**:
  - Deferred to a later release; TOTP hooks reserved in the session model.
  - Compensating controls are MANDATORY for the single-admin model: admin-login alert email on every new session/IP, login throttling (5 attempts/min/IP, exponential backoff), optional `ADMIN_IP_ALLOWLIST` env, and obscured `ADMIN_PATH` (deterrent only — never the boundary).

### 8.2 Route Architecture

- Public / User Auth Routes:
  - `/user/sign-in`
  - `/user/sign-up`
  - `/user/forgot-password`
  - `/user/reset-password`
- Protected Customer Routes:
  - `/dashboard`
  - `/plans`
  - `/checkout`
  - `/proxy-config`
  - `/transactions`
  - `/redeem`
  - `/affiliate` (gated by `CAPABILITY_AFFILIATE`)
- Obscured Admin Route:
  - The Owner/Admin area should not use an obvious generic `/admin/login` or `/admin` route. Instead, the administration panel shall be mapped via server-side configuration (e.g., `ADMIN_PATH=/ops-portal-x9z`). Do not expose this setting via client-prefixed environment variables (such as `NEXT_PUBLIC_`).
  - **Explicit Security Boundary Rule**: The hidden or custom route is **not a security boundary**. Hiding the path is solely a reconnaissance deterrent. Real authorization must be strictly enforced server-side. The Next.js 16 `proxy.ts`, server actions, and route handlers must enforce rigorous session inspection, verifying `user.role === 'ROLE_ADMIN'` regardless of the accessed URL.

### 8.3 User Identification & Collisions

- In addition to internal MongoDB `ObjectId` (`_id`), every user is assigned a human-readable, unique, collision-proof **Public User ID** (e.g., `PX-849201`).
- **Generation Strategy**: Prefix + cryptographically random alphanumeric string / Crockford Base32 encoding with unique database index enforcement.
- **UI Requirement**: Displayed prominently on the mobile profile screen with an instant one-tap "Copy to Clipboard" action.
- **Immutability**: Both the `email` address and the generated `publicUserId` are strictly **immutable**. Once an account is created, neither can ever be changed.

---

## 9. Owner/Admin Requirements

### 9.1 Executive Dashboard Metrics

The Owner dashboard provides an aggregated, real-time overview of business performance:

1. **User Metrics**:
   - Total Registered Users
   - Active Users vs. Suspended Users
   - Total Affiliate Accounts
2. **Sales & Financial Performance**:
   - Today's Sales Volume (BDT) & Order Count
   - Current Month's Gross Revenue (BDT)
   - Monthly Net Income / Estimated Profit (BDT)
   - Breakdown of Sales by Plan (1 GB, 2 GB, 5 GB, etc.)
   - Breakdown of Sales by Proxy Type (Residential, Mobile, Datacenter, Premium Residential)
3. **Bandwidth & Inventory Metrics**:
   - Total Historical Data Sold (GB) — locally recorded purchase entitlements
   - Total Active Data Remaining across customer base (GB) — provider-authoritative via cached `balance/get` snapshots (TTL worker; never live N+1 fanout).
   - Provider Stock / Upstream Pool Remaining Data (GB) via `GET /reseller/user/balance` + per-country `pool_stats`.

### 9.2 Provider Management Cards

- The dashboard displays modular **Provider Cards**:
  - **DataImpulse Card**: Active status, live balance/stock, connection status, last sync timestamp.
  - **Future Provider Cards**: Rendered with inactive / "Coming Soon" badges, serving as visual placeholders without functional backend hooks.

### 9.3 User Management Subsystem

- Exact and partial search/filtering by `publicUserId` and `email` across both the User Management and Affiliate Management tables., Status (`ACTIVE`, `SUSPENDED`), and Affiliate Status.
- Deep user inspection drawer/page displaying:
  - User profile details & registration metadata.
  - Associated DataImpulse sub-user identifier(s) (integer `id` per proxy type; see §18).
  - Total purchased data, remaining balance, and proxy entitlements.
  - Complete chronological order and transaction ledger.
  - Affiliate linkage (referred by whom, affiliate code utilized).
- **Administrative Actions (LOCKED sequences — fail-closed)**:
  - **Suspend User**: (1) `set-blocked=true` on ALL provider sub-users, (2) delete all Better Auth sessions + expire cookies, (3) flip `users.status → SUSPENDED`, (4) audit row. Step (3) MUST NOT run if (1) is unconfirmed; worker retries with backoff and alerts admin. Partial blocks are reconciled before the flip.
  - **Un-suspend / Restore User**: reverse — (1) flip status, (2) `set-blocked=false`, (3) audit. User must explicitly re-confirm if credentials were rotated while suspended.
  - **Rotate Proxy Credentials**: per-sub-user `reset-password` → re-encrypt into `proxy_accounts` → invalidate cached config strings → notify user. Mandatory after suspected leak; available on user request (rate-limited) and after restore.
  - **Upgrade to Affiliate**: toggles `CAPABILITY_AFFILIATE` (idempotent; audit).
  - **Soft Delete (DEACTIVATED)**: blocks provider access (same as suspend) + revokes sessions + anonymizes PII, preserves ALL financial/audit rows. Balance is NOT auto-dropped (forensics first).
  - **Hard Deprovision (separate, dual-confirmed admin action)**: `drop` → verify `balance==0` → `delete` sub-user → verify absent in `list`/`get`. Only for fully settled accounts; each step logged in `provider_operation_logs`.

---

## 10. Reseller/Provider Requirements

### 10.1 Multi-Provider Abstraction Architecture

The platform establishes an abstract contract that all upstream proxy vendors must fulfill:

```typescript
export interface IProxyProvider {
  providerId: string;
  providerName: string;

  // Health & Balance (bytes internally; GB only at display edge)
  getResellerBalance(): Promise<{
    balanceBytes: number;
    balanceGb: number; // derived, display only
  }>;

  // Sub-user Provisioning — poolType is REQUIRED (DataImpulse locks it at creation;
  // live `create` example omits it, so adapter must always send it explicitly and
  // tolerate upstream `residental` typo on read)
  createSubUser(args: {
    internalUserId: string;
    poolType: 'residential' | 'mobile' | 'datacenter' | 'premium_residential';
    label: string;
    threads?: number;
    stickyRange?: { start: number; end: number };
  }): Promise<{ providerSubUserId: string; login: string; password: string }>;
  getSubUserBalance(
    providerSubUserId: string,
  ): Promise<{ remainingBytes: number; totalBytes: number; usedBytes: number; threadsUsed: number }>;
  // trafficGb: integer GB (upstream unit, verified 2026-09-17). Negative values are
  // REJECTED client-side; only server-side expiry/clawback may issue negative adjustments,
  // each with its own audit row. Idempotency key = ProxyData transactionId.
  allocateBandwidth(args: {
    providerSubUserId: string;
    trafficGb: number;
    poolType: string;
    idempotencyKey: string;
  }): Promise<{ success: boolean; trafficAddedGb: number; balanceChargedGb: number }>;
  resetSubUserPassword(providerSubUserId: string): Promise<{ login: string; password: string }>;
  setBlocked(providerSubUserId: string, blocked: boolean): Promise<void>;
  deleteSubUser(providerSubUserId: string): Promise<void>; // only after drop-to-zero verified

  // Metadata Synchronization — countries (+counts via pool_stats); NO city list endpoint
  // exists upstream, so cities/states/ZIPs are connection-time params, not cached lists.
  fetchLocationMetadata(poolType: string): Promise<{
    countries: { code: string; name: string; count: number }[];
  }>;

  // Proxy Configuration Endpoint
  generateProxyCredentials(
    providerSubUserId: string,
    params: ProxyConfigParams,
  ): Promise<GeneratedProxyConfig>;
}
```

### 10.2 Financial & Inventory Tracking

For each configured provider, the Admin portal maintains:

- Provider Name & Technical Status (Healthy / Degraded / Offline).
- Authoritative Available Data Pool (GB) via `GET /reseller/user/balance` (live) plus per-country counts via `GET /reseller/common/pool_stats` (cached hourly). Submission AND approval both abort with `INSUFFICIENT_STOCK` when `requestedGb × poolCoefficient × filterMultiplier > resellerBalanceGb`.
- Pool coefficients (LOCKED, live-verified): `RESIDENTIAL ×1.0`, `DATACENTER ×0.5`, `MOBILE ×2.0`, `PREMIUM_RESIDENTIAL ×5.0`. Target-filter multiplier: `×2.0` when state/city/ZIP/ASN-include is used (`×1.0` for `PREMIUM_RESIDENTIAL` and for country/exclude-ASN-only configs).
- Cost formula (LOCKED): `providerCostBdt = ceil(requestedGb × poolCoefficient × filterMultiplier × wholesaleCostPerGbBdt)`. Both `trafficAddedGb` and `balanceChargedGb` (from `addition-history`) are stored per transaction for reconciliation.
- Manual Cost Entry: wholesale `costPerGbBdt` per pool (e.g., "500 GB pool 2026-09-01 for 25,000 BDT") when upstream exposes no cost API.
- Real-Time Margin Ledger:
  - Wholesale Cost Basis (BDT/GB, coefficient-adjusted)
  - Retail Selling Value (BDT/GB)
  - Estimated Gross Revenue & Net Profit Margins.

---

## 11. User Requirements

### 11.1 Mobile-First Customer Dashboard

- **Identity Header**: Display Name, Public User ID (with copy button), Account Status badge.
- **Bandwidth Consumption Card**:
  - Circular progress ring or visual bar illustrating:
    - Total Purchased GB (locally recorded purchase entitlement)
    - Active Remaining GB (provider-authoritative via cached `balance/get`)
    - Expiration notice (if applicable)
- **Active Entitlements List**: Chips per locked pool type (e.g., `Residential: 4.2 GB Available`, `Datacenter: Inactive`).
- **Quick Actions**:
  - `Buy Data / New Plan`
  - `Configure Proxy`
  - `Redeem Code`
  - `Order History`

### 11.2 Self-Service Profile & Settings

- View personal info (Name, Email [Read-Only], User ID).
- Profile picture upload (constrained: image/*, ≤2 MB, server-side type + dimension check, object storage — see `04` §3.1; no Gravatar — avoids third-party email leak and works offline).
- Password management (Set password for OAuth users, Change password for credential users).
- In-App Notification Center.

---

## 12. Affiliate Requirements

### 12.1 Activation & Account Model

- Affiliates are existing users with an active `CAPABILITY_AFFILIATE` flag.
- **Activation Paths**:
  1. Direct admin promotion via user management portal.
  2. Admin issues an Affiliate Invitation Link -> User accepts in dashboard.
- Activation unlocks the dedicated `/affiliate` navigation tab on mobile.

### 12.2 Referral Code Mechanics

- **Concurrent Code Usage**: An affiliate may actively use multiple of their own active affiliate codes simultaneously (e.g., deploying different codes across separate marketing channels, social campaigns, or target audiences).
- **Active Code Limit**: The maximum number of active codes an affiliate may hold concurrently is configurable in system settings (default: **5** active codes).
- **Code Management Operations**:
  - **Code Creation**: Affiliates can generate new custom referral codes up to the active-code limit.
  - **Code Deletion / Deactivation**: Affiliates can disable or delete an existing code at any time.
  - **Historical Code Retention**: Disabled or deleted codes remain in the database; historical records and transaction associations are preserved for attribution and auditing.
  - **No Reuse or Reassignment**: Once disabled or deleted, a code string cannot be reactivated, reused, or reassigned to another affiliate or user.
  - **Attribution Protection / No Direct String Modification**: Affiliates must not directly edit an existing code string if that would compromise historical attribution; instead, the business requirement is to disable/deactivate the old code and create a new one.
- **Code Rules (LOCKED)**:
  - **Format & Length**: short, user-friendly, **≤ 8 alphanumeric characters** (e.g., `SAVE10X`). Short codes are brute-forceable by design, so they are compensated by: creation throttling (3 new codes/day/affiliate), constant-time compare, identical error for unknown vs inactive codes, and redemption-side rate limits (§24.1 rule 4). High-value **redeem codes** are the opposite: **≥ 12 chars Crockford Base32 from `crypto.randomBytes`** (see §17) — never short.
  - **Uniqueness**: case-insensitive global uniqueness via unique MongoDB index with collation `strength: 2`. Code creation uses an atomic upsert; concurrent duplicate creation → exactly one wins (`11000` → `409 CODE_TAKEN`).
  - **Active-code limit**: enforced atomically (`count(ACTIVE) < limit` inside the same transaction as insert; default limit 5) — concurrent creation past the limit is impossible.
  - **Lifecycle**: `ACTIVE` -> `DISABLED` (terminal; no reactivation, no string reuse, no reassignment).

### 12.3 Attribution Model (LOCKED)

- **Rule of First Touch at registration ONLY**: the referral relationship binds when a prospective user registers with an affiliate code: `Affiliate Code -> Referred User -> Customer Profile`. An affiliate code entered at checkout is INERT — it changes neither attribution (already bound at registration) nor price (affiliate codes are not discounts; coupons are the discount instrument). It is recorded for analytics only.
- **Attribution Stability**: immutable after registration. Entering a different affiliate's code on a later purchase does **not** transfer historical attribution or commission rights.
- **Self-referral ban**: an affiliate's own codes applied to their own account earn zero commission (enforced server-side by `affiliateId != referredUserId` check at commission insert).
- Any manual attribution changes require explicit administrative intervention + `audit_logs` row.

### 12.4 Commission Structure & Profit Protection

Commissions apply exclusively to **`type=PURCHASE` transactions reaching `status=ACTIVE`**. `REDEEM` and `ADMIN_ADJUSTMENT` NEVER earn commission (a free-gift code must not mint cash). No commission for `PENDING`, `REJECTED`, `EXPIRED`, `CANCELLED`, or `FAILED` orders. Commission rows are inserted by the same worker that flips `PROVIDER_VERIFIED → ACTIVE`, inside the same MongoDB transaction — a purchase can never become `ACTIVE` without its commission decision (including explicit `৳0`) being recorded.

#### Commission Rule Configuration

The Admin configures the commission rule in a business-friendly format. The system automatically calculates the effective proportional rate:

- **Format**: `[Amount BDT] commission per [Unit GB]` (e.g., `৳30 per 5 GB`).
- **Proportional Application (LOCKED rounding)**: all money is integer BDT (whole Taka). `৳30 / 5 GB = ৳6 per GB`.
  - 1 GB purchase -> ৳6
  - 2 GB purchase -> ৳12
  - 5 GB purchase -> ৳30
  - 10 GB purchase -> ৳60
  - Non-divisible rules (e.g., `৳10 per 3 GB` = ৳3.33/GB) round the **normal commission DOWN (floor)** to whole Taka — always in the owner's favor — while percentage-discount math rounds the **customer final price half-up**. Both roundings are pinned in §14.1 and covered by acceptance tests.

#### Profit-Protected Commission

Affiliate commission must **NEVER** reduce the Owner's profit below a configured `Minimum Profit Floor`. Commission is strictly calculated using the customer's **Final Selling Price** (after the single best discount is applied).

- **Provider Cost in the margin (LOCKED)**: `Provider Cost` in the formulas above is the coefficient-adjusted cost from §10.2 (`requestedGb × poolCoefficient × filterMultiplier × wholesaleCostPerGbBdt`), NOT the raw GB count. A 10 GB mobile order at ৳100/GB wholesale costs ৳2000, not ৳1000 — commissions computed on unadjusted cost overpay and breach the profit floor.
- **Actual Margin** = `Customer Final Price` - `Provider Cost`
- **Maximum Safe Commission** = `Actual Margin` - `Owner Minimum Profit Floor`
- **Final Affiliate Commission** = `MIN(Normal Calculated Commission, Maximum Safe Commission)`
- _Constraint_: Commission can never be negative. If `Maximum Safe Commission <= 0`, the commission is strictly `৳0`.

**Example Scenarios** (Assuming: Cost = ৳650, Normal Price = ৳700, Rule = ৳30 per 5GB, Profit Floor = ৳15):

1. **Normal Sale (No Discount)**: Final Price = ৳700. Margin = ৳50. Safe Commission = (50 - 15) = ৳35. Affiliate gets `MIN(30, 35) = ৳30`. Owner profits ৳20.
2. **Discounted Sale**: Final Price = ৳680. Margin = ৳30. Safe Commission = (30 - 15) = ৳15. Affiliate gets `MIN(30, 15) = ৳15`. Owner profits ৳15.
3. **Heavy Discount**: Final Price = ৳660. Margin = ৳10. Safe Commission = (10 - 15) = -৳5. Affiliate gets `৳0`.

#### Commission Rule Snapshot

When a qualifying purchase generates a commission, the system stores a comprehensive, immutable historical snapshot. Later changes to plans, costs, or rules will **not** alter this historical record. The snapshot includes:

- Original plan price
- Provider cost basis used
- Discount amount & discount source
- Final customer selling price
- Configured normal commission rule
- Minimum profit floor
- Calculated owner margin
- Qualifying bandwidth
- Final effective commission amount
- Transaction ID

### 12.5 Financial Settlement & Payouts

- **Reporting Metrics for Affiliate**:
  - Total Referred Users (Active vs. Inactive)
  - Referral Purchases Count
  - Total Bandwidth Sold via Referral (GB)
  - Total Lifetime Commission Earned (BDT)
  - Commission Paid to Date (BDT)
  - Current Unpaid / Due Commission Balance (BDT)
- **Accounting Period (LOCKED)**:
  - Default cadence: Calendar month in **Asia/Dhaka** (1st 00:00 to last 23:59 Dhaka time; stored as `YYYY-MM` + UTC range pair). All period math uses this zone — UTC-only computation drifts month boundaries for local payouts.
  - Admin may execute ad-hoc mid-month manual settlements.
- **Payout State Machine**:
  `UNPAID` -> `PARTIALLY_PAID` -> `PAID`
- **Manual Payout Flow**:
  1. Admin opens affiliate settlement ledger.
  2. Enters payout amount (full or partial), payout date, reference note (e.g., "bKash TrxID #8291A").
  3. Optional file upload of receipt / payment screenshot.
  4. System updates affiliate unpaid balance and logs an immutable `PayoutRecord`.
  5. Affiliate receives an automated in-app notification of the payout.

---

### 12.6 Commission Rule Hierarchy (LOCKED units)

Commission logic resolves in this explicit order (all rules share ONE shape: `{ commissionAmountBdt, commissionBandwidthGb }`; per-GB rate = amount ÷ bandwidth, floored per §12.4):

1. **Plan-Specific Override**: if a rule is defined for the purchased plan, it wins.
2. **Affiliate-Specific Override**: else the affiliate's custom global rate applies.
3. **Global Default**: else `system_settings.defaultCommissionPerGbBdt` applies, interpreted as `{ commissionAmountBdt: <value>, commissionBandwidthGb: 1 }`.

---

## 13. Plans

### 13.1 Dynamic Plan Entity

Plans are fully configurable by the Owner and stored in MongoDB. No plans are hard-coded in the frontend or backend.

```typescript
export interface Plan {
  id: string;
  name: string; // e.g., "5 GB Residential Starter"
  providerId: string; // e.g., "dataimpulse"
  proxyType: 'RESIDENTIAL' | 'MOBILE' | 'DATACENTER' | 'PREMIUM_RESIDENTIAL'; // LOCKED 4-pool enum
  bandwidthGb: number; // e.g., 5 — integer GB (upstream unit); converted to bytes (×1073741824) for all ledger math
  retailPriceBdt: number; // e.g., 500 — integer BDT, whole Taka
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  validityDays?: number; // optional access window. DataImpulse traffic NEVER expires upstream, so expiry is enforced LOCALLY: on expiry the worker applies expiryAction (default BLOCK). See §18.2.
  expiryAction?: "BLOCK" | "BLOCK_AND_RECLAIM"; // BLOCK = set-blocked, keep balance for forensics; BLOCK_AND_RECLAIM = block + drop/negative-adjust remainder to reseller pool. Default BLOCK.
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 13.2 Initial Standard Tiers (Reference Defaults)

- 1 GB Package
- 2 GB Package
- 5 GB Package
- 10 GB Package

---

## 14. Pricing

### 14.1 Server-Authoritative Computation Engine

- **Golden Rule**: Prices submitted by the client browser are **never trusted**.
- When a user submits a purchase request, the client transmits only `{ planId, couponCode?, affiliateCode?, targetFilters? }` — never amounts.
- The server-side pricing engine executes (integer BDT throughout):
  ```
  OfferDiscount   = active offer for plan (fixed or % capped), else 0
  CouponDiscount  = validated coupon benefit (fixed or % capped), else 0
  AppliedDiscount = MAX(OfferDiscount, CouponDiscount); tie → Offer
  FinalAmount     = BasePlanPrice - AppliedDiscount   (half-up rounding on % math, floor at 0)
  ProviderCost    = ceil(bandwidthGb × poolCoefficient × filterMultiplier × wholesaleCostPerGbBdt)
  ```
- The backend verifies at both submission AND approval:
  - Price Lock: snapshot `{basePriceBdt, offerDiscountBdt, couponDiscountBdt, finalDiscountAppliedBdt, discountSource, couponCode, finalAmountBdt, providerCostBdt, poolCoefficient, filterMultiplier, trafficAddedGb, balanceChargedGb}` at submission. At approval, re-fetch plan/coupon/provider state; ANY drift (price changed, plan not `ACTIVE`, coupon exhausted/expired, stock insufficient) aborts approval back to `PENDING` with a re-confirm event. Approval never silently charges a new price.
  1. Plan exists and has status `ACTIVE`.
  2. User is eligible for the plan (`ACTIVE` account, entitled proxy type allowed).
  3. Upstream provider is active AND reseller balance covers `bandwidthGb × poolCoefficient × filterMultiplier`.
  4. Coupon (if applied) is valid, active, strictly bound to the selected plan, within `validFrom/validTo`, and its atomic claim succeeds (see §15.3).
  5. Affiliate code (if any) is recorded for analytics; an unknown or inactive code is IGNORED with a non-blocking warning — it never fails verification, never blocks checkout, and never bounces an approval (codes are inert at checkout, §12.3). Self-use is stripped from commission but never blocks checkout.
  6. Final calculated amount is mathematically non-negative (`>= 0`).

---

## 15. Offers and Coupons

### 15.1 Offers vs. Coupons

The Admin's discount area contains both **Offers** and **Coupons**, but they are fundamentally different business mechanisms:

**Offers**:

- Belong to a specific plan.
- Configured directly by the Admin.
- Visible to everyone eligible for that plan (no code required).
- Changes the promotional selling price (e.g., Base price = ৳700, Offer discount = ৳20, Offer price = ৳680). The UI should clearly show the original price crossed out alongside the promotional price.

**Coupons**:

- Require the user to enter a specific code.
- Support fixed discount or percentage discount.
- Configurable as one-time use (becomes unusable immediately after successful use) or multiple-use.
- Can have a validity period and usage limits.
- Optional user-specific targeting.
- A reusable coupon remains active until expiry, usage limit reached, or admin manually disables it.
- Admin must be able to create, generate code, configure rules, view usage history (including which users used it), and disable the coupon.
- Every successful coupon use must remain historically recorded.

### 15.2 Coupon vs Offer Priority

The system must **never** stack both discounts. For a given purchase, determine the best applicable discount between the active plan offer and the applicable coupon, and use only **ONE**.

- **Rule**: If a valid coupon gives a greater discount than the plan offer, use the coupon. If the offer gives an equal or greater discount, use the offer.
- **Example 1**: Base = ৳700, Offer = ৳20 off, Coupon = ৳50 off. Final = ৳650 (Coupon wins).
- **Example 2**: Base = ৳700, Offer = ৳20 off, Coupon = ৳10 off. Final = ৳680 (Offer wins).

### 15.3 Coupon Atomic Claim (LOCKED — concurrency)

Validation at submission is advisory only (price preview). The BINDING claim happens at **approval**, inside the same MongoDB transaction that flips `PENDING → APPROVED`:
1. `coupon_usages` insert with unique `(couponId, transactionId)`; duplicate → abort approval.
2. `coupons.usageCount $inc` with guard `usageCount < usageLimit` (when limited); guard failure → abort approval back to `PENDING` with “coupon exhausted” event.
3. `isOneTime` coupons flip to `INACTIVE` in the same transaction after the first successful claim.
Two concurrent approvals consuming the last coupon slot → exactly one commits; the other rolls back. `coupon_usages` rows are append-only audit (never deleted).

## 16. Purchase Flow (Manual Payment)

### 16.1 Step-by-Step User Journey

1. **Selection**: User selects Provider (DataImpulse) -> Proxy Type -> Desired GB Tier (e.g., 5 GB).
2. **Review**: User enters optional Coupon Code. Server calculates and renders the exact breakdown (Subtotal, Discount, Total Payable in BDT).
3. **Payment Instructions Display**: Modal/screen renders Owner's manual payment instructions (e.g., "Send 500 BDT via bKash/Nagad Personal to 017XXXXXXXX").
4. **Submission**: User inputs payment reference details (e.g., Sender Mobile Number, Transaction ID / TrxID) and submits the order request.

### 16.2 Order State Machine (LOCKED)

Locked status enum — `PENDING | APPROVED | ALLOCATING | PROVIDER_VERIFIED | ACTIVE | REJECTED | CANCELLED | EXPIRED | FAILED`. No other statuses permitted in code; Zod enum enforced server-side.

```
      [ User Submits Request ]
                 │
                 ▼
             PENDING ──────────────┐ (7 Days UTC Inactivity / Expiry Timer)
                 │                 ▼
      [ Admin Action ]          EXPIRED (terminal; cron only, never manual)
       ├── Rejected ──► REJECTED (terminal; reason required)
       ├── Cancelled ─► CANCELLED (terminal; user- or admin-initiated before approval)
       │
       ▼
   APPROVED (Payment Verified by Admin; price snapshot re-validated here)
       │
       ▼
   ALLOCATING (System calls DataImpulse balance/add; idempotency key = transactionId)
       │
       ├── Provider Allocation Fails ──► FAILED (Requires Admin Retry via FAILED → ALLOCATING)
       │
       ▼
   PROVIDER_VERIFIED (Authoritative sub-user quota confirmed via balance/get)
       │
       ▼
     ACTIVE (terminal success; Bandwidth and Proxy Access Unlocked for User)
```

Transition rules (all via atomic `findOneAndUpdate` with status precondition; every transition writes `audit_logs` + `provider_operation_logs` for provider calls):
- `PENDING → APPROVED | REJECTED | CANCELLED | EXPIRED` only.
- `APPROVED → ALLOCATING` only, executed by worker immediately after approval (single-flight per transactionId; never from client input).
- `ALLOCATING → PROVIDER_VERIFIED | FAILED` only.
- `PROVIDER_VERIFIED → ACTIVE` only (system, after balance/get confirms `balance_total` increased by ordered bytes).
- `FAILED → ALLOCATING` (admin retry, same idempotency key; must re-check live balance before re-sending to avoid double allocation).
- Stale-`ALLOCATING` sweeper: any `ALLOCATING` older than 30 minutes without a terminal `provider_operation_logs` entry is flagged for reconciliation (check live balance; then move to `PROVIDER_VERIFIED` or `FAILED`) — never auto-`ACTIVE`.
- Terminal states (`ACTIVE`, `REJECTED`, `CANCELLED`, `EXPIRED`, `FAILED` after final admin close) are immutable except `FAILED → ALLOCATING` retry.

> Live DataImpulse mapping (verified 2026-09-17, see `archive/06-DATAIMPULSE-API-VERIFICATION.md`): approval worker calls `POST /reseller/sub-user/balance/add {subuser_id, traffic_gb}`, confirms with `GET /reseller/sub-user/balance/get`, reconciles with `GET .../balance/addition-history`. `traffic` unit = GB integer; balances = bytes.

### 16.3 Expiration Policy

- Any purchase request remaining in `PENDING` status for longer than exactly **7 days (UTC)** is automatically transitioned to `EXPIRED` by a scheduled background worker (runs hourly; cutoff `createdAt < now - 7d`).
- The threshold value is stored centrally in `system_settings.pendingRequestExpiryDays` (default `7`) and is not hard-coded across modules. Changing it affects only transactions created after the change.
- `EXPIRED` is terminal and releases no bandwidth (nothing was allocated while `PENDING`). No coupon capacity was consumed while `PENDING` either (binding claim happens at approval, §15.3), so expiry releases nothing — an approval transaction racing the expiry cron loses on the status precondition and rolls back.

---

## 17. Redeem Flow

### 17.1 Redeem Code Specification

- **Generator**: Generated exclusively by the Owner/Admin via the administration portal.
- **Scope**: Represents an internal ProxyData gift/credit instrument. (DataImpulse does not need a native redeem concept).
- **Code Payload Definition**:
  - Provider ID
  - Proxy Type
  - Bandwidth (GB)
  - Associated Plan Reference
  - Monetary Valuation (for ledger records)
  - Optional Expiration Date
- **Lifecycle & Rules (LOCKED — matches DB §17)**:
  - Redeem codes are valid for **30 days** by default (`validTo`, configurable per code).
  - One redeem code is redeemed successfully at most once (atomic claim; 10 concurrent attempts → exactly 1 success).
  - Redeemed codes are shown as `USED` and are **never deleted**.
  - Full lifecycle: `GENERATED` -> `ACTIVE` -> `PROCESSING` -> `PROVIDER_ALLOCATED` -> `USED`.
  - Early exits: `GENERATED`/`ACTIVE` -> `EXPIRED` (past `validTo`, via cron) / `DISABLED` (admin revoke; reason required).
  - `GENERATED` is the instant-of-creation state; codes with no future `validFrom` become `ACTIVE` immediately in the same write. No code is redeemable while `GENERATED`.
  - Redemption claim is `ACTIVE → PROCESSING` via atomic `findOneAndUpdate`; `USED` is written only after provider `balance/add` + `balance/get` confirmation. Provider failure reverts `PROCESSING → ACTIVE` (retryable) or escalates to admin review — never silently to `USED`.

### 17.2 Concurrency & Transactional Strategy (LOCKED)

- **Single-Use Invariant**: enforced by the atomic `ACTIVE → PROCESSING` claim plus a unique index on `redeem_codes.code`. The claim and the `transactions(type=REDEEM)` insert share one MongoDB multi-document transaction; if either fails, both roll back.
- **Idempotency**: client must send `Idempotency-Key` (redeem `code` + userId hash); server dedupes on `(code, redeemedBy)` unique partial index.
- **Provider Timeout Recovery**: `PROCESSING` rows older than 15 minutes are picked up by the reconciler: check `addition-history` + live `balance/get`; on proof of allocation advance to `PROVIDER_ALLOCATED → USED`, else revert to `ACTIVE`. See DB §17/§36/§51.

---

## 18. Proxy Entitlement

### 18.1 Server-Enforced Proxy Type Isolation & Multiple Plans

- **Multiple Concurrent Plans**: Users can purchase and maintain multiple active proxy plans concurrently (e.g., 5 GB Residential and 2 GB Mobile).
- **Sub-User Mapping**: Because the upstream DataImpulse `pool_type` parameter is permanently locked upon sub-user creation, ProxyData must provision a separate DataImpulse sub-user account for each distinct proxy type a customer purchases (e.g., User A gets one sub-user for Residential, and another for Mobile).
- **Bandwidth Addition Rule**: If the same user buys the same proxy type again (whether via normal purchase, admin approval, or redeem code), do NOT create another sub-user. Instead, add the newly purchased bandwidth to the _existing_ sub-user for that provider + proxy type.
- **Distinctions**:
  - _Proxy Account_ = persistent DataImpulse sub-user identity.
  - _Transaction_ = each individual purchase/redeem event.
  - _Remaining Balance_ = provider-authoritative current balance.
- **Credential Separation**: As a result of this sub-user mapping, customers holding multiple proxy types will possess distinct proxy credentials (username/password) for each pool type. The dashboard must clearly separate the configuration parameters and credentials for each active plan.
- **Rule**: If a customer holds an active balance for an entitled proxy type (e.g., 5 GB Residential), their generated credentials are valid strictly for that specific proxy type's gateways.
- Attempting to configure or connect through unentitled proxy type gateways will be rejected:
  1. Frontend hides or locks unentitled tabs.
  2. Backend configuration generator rejects requests for unentitled proxy types (`403 Forbidden`).

---

## 19. Proxy Configuration

### 19.1 Mobile-First Configuration Interface

The proxy generator allows users to customize their connection parameters (verified against live DataImpulse docs 2026-09-17 — see `archive/06-DATAIMPULSE-API-VERIFICATION.md` §2–§3; wire encoding now canonical in `03` §6):

- **Configuration Fields**:
  - Target Country (dropdown from cached `provider_metadata`; base price, 1x billing).
  - Target State / City / ZIP / ASN-include (optional; **2x billing multiplier**, except `PREMIUM_RESIDENTIAL` where included at 1x). Requires country first. Failures surface upstream `400 NO_RAY` as “No IPs for this filter — try another city/ASN” (never a silent empty string).
  - Exclude ASN (optional; base price, 1x).
  - Sticky vs Rotating (rotating: HTTP `:823` / SOCKS5 `:824`; sticky: `:10000–20000` mapped from `sticky_range`). Defaults: rotating.
  - Threads (default 100, max per plan), Rotation interval, Anonymous filter (pass-through to `default_pool_parameters`).
  - Protocol (HTTP / SOCKS5).
  - Output Format (Host:Port:User:Pass or cURL command; password masked by default with reveal-once).
- **Gateway (LOCKED)**: `gw.dataimpulse.com` (DNS, preferred) — never hardcode `74.81.81.81` except as documented fallback. Custom white-label DNS host is DEFERRED (decision log in `05`); config generator must read host/ports from server env so a future custom host needs no UI change.
- **Cost warning**: selecting any 2x filter shows an explicit “uses 2x bandwidth” surcharge line in checkout, computed into `providerCostBdt` via the §10.2 formula.
- **Action Tools**:
  - Dedicated "Copy Endpoint" button.
  - Dedicated "Copy Credentials" button.
  - Dedicated "Copy Complete Proxy String" button.

### 19.2 Configuration State Persistence

- The system stores only the **latest saved configuration** per proxy type for each user.
- Historical versions of configuration strings are not archived.
- If no previous configuration exists, the interface pre-populates default recommendations provided by the upstream adapter.

### 19.3 Centralized Metadata Caching

- Country lists (+ per-country pool counts) are synced hourly from `locations` + `pool_stats` into MongoDB by a single-leader cron (upsert, never full overwrite); clients read local `/api/proxy/metadata`.
- Client browsers query local MongoDB collections (`/api/proxy/metadata`) to prevent duplicate upstream API requests.

---

## 20. Data / GB Tracking

### 20.1 Source of Authority

The system maintains a clear conceptual and operational distinction between purchased and remaining bandwidth:

- **Purchased GB**: Locally recorded purchase entitlement representing the volume of proxy data the customer has acquired through approved orders or redeem codes.
- **Remaining GB**: provider-authoritative balance from `balance/get`, cached with short TTL. The upstream provider is the source of truth for active balances.
- ProxyData queries the provider API for the user's sub-user balance and caches it with a short time-to-live (TTL) to prevent stale displays without exceeding rate limits.
- The platform does **not** attempt to calculate packet-level bandwidth consumption independently.

---

## 21. Transactions

### 21.1 Comprehensive Audit Ledger & Immutability

Every event that affects an order, balance, or proxy allotment produces an audit document in the `transactions` collection:

- **Immutability Principle**: Historical financial transactions must strictly preserve the original plan price, applied discount, discount type (offer vs coupon), final payable amount, coupon code if used, and offer information if used. Later plan, offer, or coupon changes must **not** alter historical transactions. Controlled lifecycle and status fields may transition strictly through the defined order state machine (`PENDING` → `APPROVED` → `ALLOCATING` → `PROVIDER_VERIFIED` → `ACTIVE`, with `REJECTED`/`CANCELLED`/`EXPIRED`/`FAILED` exits — §16.2).
- `transactionId`: Unique public tracking ID (e.g., `TX-9018247`).
- `userId`: Associated customer ID.
- `type`: `PURCHASE` | `REDEEM` | `ADMIN_ADJUSTMENT` (LOCKED — matches DB §15; no other values).
- `providerId`: Target provider identifier.
- `proxyType`: `RESIDENTIAL` | `MOBILE` | `DATACENTER` | `PREMIUM_RESIDENTIAL` (LOCKED — 4 pools; provider raw strings mapped in adapter, incl. upstream `residental` typo tolerance).
- `bandwidthBytes`: Bandwidth volume as integer bytes (1 GiB = 1073741824). Ordering UI shows GB; all math persists bytes.
- `basePriceBdt`: Plan price before discounts (integer BDT, whole Taka; percentage math rounds half-up to Taka at the final step — see §14).
- `finalDiscountAppliedBdt`: The ONE applied discount (offer or coupon, never stacked).
- `finalAmountBdt`: Amount payable (integer BDT, `>= 0` enforced server-side).
- `couponCode`: Coupon used (if any).
- `paymentDetails`: Manual payment reference `{ senderNumber (normalized E.164-ish MSISDN), TrxID (uppercased, trimmed), notes }`. `TrxID` has a sparse unique index — resubmission of the same TrxID is rejected with `409 DUPLICATE_TRXID`, and the admin queue surfaces near-duplicate TrxIDs for review (replay-fraud guard).
- `status`: `PENDING` | `APPROVED` | `ALLOCATING` | `PROVIDER_VERIFIED` | `ACTIVE` | `REJECTED` | `CANCELLED` | `EXPIRED` | `FAILED` (LOCKED — full machine in §16.2).
- `affiliateAttribution`: `{ affiliateId, code, commissionAmountBdt }` (only for `type=PURCHASE`; `REDEEM` and `ADMIN_ADJUSTMENT` NEVER earn commission).
- `timestamps`: `{ createdAt, approvedAt, activatedAt, expiredAt }`.
- **Price-Lock Rule (LOCKED)**: the financial snapshot (`basePriceBdt`, discounts, `finalAmountBdt`, `providerCostBdt`, coefficients) is frozen at **submission** from server-side data only. At **approval**, the worker re-validates (plan still `ACTIVE`, price unchanged, coupon still valid, reseller balance sufficient); any drift aborts approval back to `PENDING` with a user-visible “price changed — please re-confirm” event. Client-sent prices are ignored (see §30 rule 1).

---

## 22. Notifications

### 22.1 In-App Notification Engine

Users receive real-time and persistent in-app notifications for critical milestones:

1. **Purchase Request Received**: Confirms order submission and pending review.
2. **Purchase Approved**: Confirms payment validation and begins allocation.
3. **Proxy Activated**: Informs user that data is provisioned and ready for use.
4. **Purchase Rejected / Cancelled**: Explains administrative rejection reason.
5. **Purchase Expired**: Alerts user that an unverified order reached the time limit.
6. **Redeem Success**: Confirms code redemption and credited GB.
7. **Account Status Changes**: Alerts user of suspension or reinstatement.
8. **Affiliate Events**: Alerts affiliate of new qualified referrals or manual payouts.

---

## 23. PWA / UI Requirements

### 23.1 Mobile-First Design System

- Built with **Tailwind CSS v4** and **HeroUI v3** (CSS-first theming, no Provider wrapper — §5).
- Optimized for one-handed thumb navigation on screens as small as 360px width.
- Desktop layout is treated as a clean, expanded extension of the mobile structure (utilizing max-width containers, side drawers, and responsive grid cards).
- Visual status chips with unambiguous color coding (e.g., Green = Active, Yellow = Pending, Red = Suspended/Expired).

### 23.2 PWA Specification & Experience

- Manifest configuration specifying standalone display, high-resolution icons, and branded theme colors.
- **PWA Installation Business Requirements**:
  - Show an installation call-to-action (CTA / banner / button) when installation is available on the user's browser or device.
  - Suppress the installation prompt once the application is successfully installed.
  - Maintain a polished, responsive, mobile-first PWA experience across supported devices.
  - _Note_: Specific event mechanisms (such as `beforeinstallprompt` or `appinstalled`) are treated as browser-dependent implementation details rather than rigid business requirements.

---

## 24. Security Requirements

### 24.1 Critical Guardrails

1. **Server-Side Enforcement**: All authorization, plan eligibility, pricing math, coupon applicability, and entitlement restrictions must be validated server-side.
2. **Credential & Secret Protection**: DataImpulse credentials and secrets must never be exposed to browser/client code, public API responses, client logs, or client-side environment variables. All upstream master API keys, reseller secrets, and administrative tokens must reside strictly in server-side environment variables.
3. **Session Revocation for Suspended Users**: suspension/deactivation runs the fail-closed sequence — (a) `set-blocked=true` on ALL provider sub-users, (b) delete all Better Auth `sessions` rows for the user + expire cookies, (c) flip `users.status`, (d) write `audit_logs`. If (a) fails, the DB flip MUST NOT proceed; the worker retries with backoff and pages the admin. Restore reverses the order (DB first, then unblock). Cookie sessions are the revocation unit — there is no JWT-flag shortcut.
4. **Rate Limiting & Abuse Prevention (LOCKED minima)**: checkout submit 10/min/user (30/min/IP), coupon validate 20/min/IP, redeem 5/min/user (15/min/IP), auth 5/min/IP with backoff, admin auth 5/min/IP + alert. Exceeding returns `429` with `Retry-After`; repeated violations trigger temporary IP cool-down. Redeem/affiliate codes: constant-time compare, no existence oracle (identical error for bad vs used code to non-owners).
5. **Financial Ledger Immutability**: Historical financial facts (e.g., base amounts, discounts, final amounts, user IDs, plan identifiers, timestamps of creation) must not be destructively edited or deleted, while controlled lifecycle and status fields may transition strictly through the defined state machine.
6. **Audit redaction**: `audit_logs.changes` and `provider_operation_logs.payload` MUST NEVER contain proxy passwords, Better Auth tokens, full TrxIDs (last-4 only), or reset tokens. Violation is a P0 bug.

---

## 25. Audit Logging

### 25.1 Immutable Administrative Audit Trail

All security-critical and financial administrative actions must record an entry in the `audit_logs` collection:

- `actorId`: Admin User ID who initiated the action.
- `action`: e.g., `USER_SUSPENDED`, `USER_RESTORED`, `PURCHASE_APPROVED`, `PURCHASE_REJECTED`, `COUPON_CREATED`, `PLAN_MODIFIED`, `PAYOUT_EXECUTED`.
- `targetId`: Target entity ID (e.g., affected User ID, Plan ID, Order ID).
- `ipAddress`: Originating client IP address.
- `timestamp`: UTC timestamp.
- `changes`: Snapshot of before and after states (REDACTED per §24.1 rule 6 — passwords, tokens, full TrxIDs forbidden).

---

## 26. DataImpulse Dependencies

The following operations depend directly on external DataImpulse systems and require upstream availability (all verified live 2026-09-17 — see `archive/06-DATAIMPULSE-API-VERIFICATION.md`):

1. Master reseller inventory checks (`GET /reseller/user/balance`, `GET /reseller/common/pool_stats`).
2. Sub-user account creation and mapping (`POST /reseller/sub-user/create` with explicit `pool_type`; `GET /reseller/sub-user/list` for reconciliation).
3. Allocation and assignment of bandwidth (`POST /reseller/sub-user/balance/add`, incl. negative-adjustment path reserved for server-side clawback only).
4. Real-time balance and consumption queries (`GET /reseller/sub-user/balance/get`, `.../addition-history`, `.../usage-stat/*`).
5. Credential lifecycle (`POST /reseller/sub-user/reset-password`) and access control (`POST .../set-blocked`, `POST .../delete` after drop-to-zero).
6. Regional node and pool queries (`GET /reseller/common/locations`).

---

## 27. Assumptions

- **Gateway Configuration (LOCKED, live-verified 2026-09-17)**: DataImpulse gateways are static config, not API-returned. Server env: `DATAIMPULSE_GATEWAY_HOST=gw.dataimpulse.com` (DNS preferred; `74.81.81.81` fallback only), rotating `HTTP_PORT=823` / `SOCKS5_PORT=824`, sticky `10000–20000` (from `sticky_range`). Startup health check asserts DNS resolution + TCP reachability; config generator reads only these vars so a future white-label custom DNS host needs no code change.

1. **Manual Financial Verification**: The Owner has a dependable out-of-band workflow to verify incoming mobile payments (e.g., checking SMS/banking apps for TrxID matches).
2. **Sub-User Isolation**: DataImpulse provides an API capability to create isolated sub-user accounts whose usage does not interfere with other sub-users.
3. **Traffic Counting**: DataImpulse correctly meters bandwidth consumption upstream, eliminating any requirement for ProxyData to host intermediate proxy tunnels or packet sniffers.
4. **Single Admin Operating Model**: The initial business operation requires only one Owner/Admin account with total access.
5. **Currency**: All commercial operations and retail pricing in the initial release are denominated in Bangladeshi Taka (BDT).

---

## 28. Open Questions (all P0 items RESOLVED 2026-09-17 — remaining are pre-launch sandbox confirmations)

1. **Sub-User Lifecycle**: RESOLVED — `POST .../set-blocked` pauses; `POST .../delete` removes (drop-to-zero first). Sandbox must still confirm delete-forfeits vs refunds remainder.
2. **Bandwidth Expiration**: RESOLVED — DataImpulse traffic NEVER expires upstream; ProxyData enforces `validityDays` locally via `expiryAction` (`BLOCK` default, `BLOCK_AND_RECLAIM` optional). No upstream timestamp exists.
3. **Rate Limits**: PARTIAL — upstream publishes none; ProxyData enforces own limits (§24.1) + provider-call budget (metadata hourly, balance reads via TTL cache, never N+1 fanout). Sandbox should probe 429 thresholds and record them here.
4. **Minimum Allocation Units**: DEFAULT LOCKED — integer GB (`traffic: 1` minimum in all live examples). Sandbox must confirm `traffic:1` → +1 GiB and whether fractional/zero are rejected.

---

## 29. Future Features (Deferred Backlog)

- Automated Payment Gateways (bKash Checkout, Nagad Checkout, SSLCommerz, Stripe).
- Secondary Upstream Proxy Providers (e.g., BrightData, Oxylabs, IPRoyal) integrated via `IProxyProvider`.
- Automated Affiliate Payout Disbursements (direct MFS API payout integration).
- Two-Factor Authentication (TOTP / Authenticator Apps).
- Multi-Tier Staff RBAC (Support Agent, Billing Moderator, Super Admin).
- Dynamic Customer Loyalty Rules & Milestone Rewards.
- Automated reseller-balance auto-top-up / auto-recharge (reconciliation and sweeper crons themselves are CORE — §16/§36 — not backlog).

---

## 30. Acceptance-Level Business Rules

1. **Zero Client Price Trust**: If a client POST request sends `{ planId: "5gb", price: 100 }`, but the database lists the price as `500`, the server **must reject or override** the payload with the authoritative 500 BDT amount.
2. **Atomic Single Redemption**: If 10 concurrent requests attempt to redeem the exact same redeem code simultaneously, exactly **one** request may succeed; the other 9 must receive an invalid/already-used rejection. The code must not be marked `USED` until provider provisioning succeeds (lifecycle `GENERATED → ACTIVE → PROCESSING → PROVIDER_ALLOCATED → USED`, §17).
3. **Strict Type Entitlement**: A customer holding an active balance for an entitled proxy type and zero balance for another type must receive a `403 Forbidden` from the backend when querying unentitled proxy generation endpoints. Entitled set = `RESIDENTIAL | MOBILE | DATACENTER | PREMIUM_RESIDENTIAL` with live balance > 0 and account `ACTIVE`.
4. **Non-Reversible Affiliate Attribution**: If User A registers via Affiliate Code `AFF1`, their referral attribution is permanently locked to `AFF1`. Entering Affiliate Code `AFF2` during a later checkout will not alter the commission recipient.
5. **Suspended User Read-Only Quarantine**: A suspended user must be permitted to view previous purchase histories, but any invocation of `/api/checkout`, `/api/redeem`, or `/api/proxy/generate` must abort with a `403 Account Suspended` error.
6. **Soft Deletion Integrity**: Calling "delete" on a user, affiliate code, or transaction must never execute a hard SQL/NoSQL `DELETE` operation if financial or audit logs link to that record.

---

## 31. Live-Verified Audit Outcomes (replaces PENDING_API_AUDIT table — 2026-09-17)

All 12 items verified against the live Postman collection + official docs; evidence in `archive/06-DATAIMPULSE-API-VERIFICATION.md`. No `PENDING_API_AUDIT` marker remains normative in this document.

| Requirement ID  | Operational Area             | Verified outcome |
| :-------------- | :--------------------------- | :--------------- |
| **AUDIT-DP-01** | Sub-User Provisioning        | `POST /reseller/sub-user/create` — adapter always sends explicit `pool_type`; tolerate `residental` typo on read. |
| **AUDIT-DP-02** | Sub-User Identifier          | Integer `id` + `login`/`password` triple; `id` is the mapping key. |
| **AUDIT-DP-03** | Bandwidth Allocation         | `POST .../balance/add {subuser_id, traffic_gb}` (integer GB); idempotency key = transactionId; negative path server-only. |
| **AUDIT-DP-04** | Balance Inspection           | `GET .../balance/get` (bytes + formats + `threads_used`); `.../addition-history` gives `traffic_added` vs `balance_charged`. |
| **AUDIT-DP-05** | Master Reseller Balance      | `GET /reseller/user/balance` + `GET /reseller/common/pool_stats` (per-country counts). |
| **AUDIT-DP-06** | Upstream Cost Query          | No cost API — manual `costPerGbBdt` per pool + coefficient formula (§10.2). |
| **AUDIT-DP-07** | Proxy Credentials Format     | `login`/`password` (plaintext from API; AES-256 at rest locally) + IP-whitelist alternative. |
| **AUDIT-DP-08** | Geo/ASN Metadata API         | `locations` = countries only; cities/states/ZIPs are connection params (2x), not listable. |
| **AUDIT-DP-09** | Proxy Types & Gateway Access | 4 pools (incl. premium ×5); gateways `gw.dataimpulse.com:823/824/10000+` (§19). |
| **AUDIT-DP-10** | Quota Expiration Control     | No upstream expiry — local `validityDays` + `expiryAction` enforcement. |
| **AUDIT-DP-11** | Sub-User Suspension          | `set-blocked` (pause) + `delete` after drop-to-zero (remove). |
| **AUDIT-DP-12** | API Rate Limits & Quotas     | Unpublished — own limits + call budget (§24.1, §28 item 3). |

## 32. Email & Notifications (STRICT LIMIT MODE)

Due to infrastructure constraints (100 outbound emails/day max), the system relies **entirely** on the persistent In-App Notification feed and transient UI Toasts for all transactional alerts (approvals, rejections, redemptions, payouts). 

**Outbound Emails are strictly limited to the following:**
1. **Password Resets (Customer)**: Secure password reset link. 
   - *Constraint*: The link is valid for 24 hours. Rate-limited to a maximum of 1 request per user per day to protect the daily email quota.
2. **Admin Data Low Alert (System)**: Sent only when the aggregate provider stock drops below the configured safe threshold.
3. **Admin Daily Summary (System)**: A single daily digest sent to the Admin summarizing total sales, redemptions, and pending queue size.

*No other emails are sent by the system.*

