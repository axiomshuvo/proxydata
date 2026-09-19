# ProxyData Massive Execution Master Workplan (200+ Steps)

> **Doc precedence**: `01` + `02` + `03` + `04` are normative. This workplan is the execution checklist ONLY — on any conflict, the four plan docs win (see `00` §4). steps marked **[LOCKED-SPEC]** quote the binding rule inline so agents never follow a stale paraphrase.

This is the exhaustive, atomic-level roadmap for developing ProxyData from UI conception to Hostinger production deployment.

## CORE EXECUTION RULE: GIT COMMITS

The AI executing this plan must **NEVER** push to GitHub automatically.
After completing a Phase the AI must stop, review the changes, and output a clean, formatted `git commit -m "..."` command for the user to run. The user retains full control over pushing code.

## PHASE 1: HTML/Tailwind Prototyping & AI Review (Current Phase)

_Goal: Perfect the visual language before writing business logic._

- [x] 1. Initial UI System architecture documentation.
- [x] 2. Mockup Public Landing Page (`mockups/v1_landing.html` — exists, loads clean; quality review deferred to steps 16–18).
- [x] 3. Mockup Customer Dashboard structure (`mockups/v1_user_dashboard.html` — exists, loads clean; quality review deferred).
- [ ] 4. Refine Dashboard to Obsidian/Cyan glassmorphism aesthetic.
- [ ] 5. Implement multi-select badge UI for City/Zip/ASN in HTML.
- [ ] 6. Implement dynamic connection string preview in HTML.
- [ ] 7. Mockup Buy Proxies / Checkout view (no checkout mockup exists).
- [x] 8. Mockup Transaction History view (`mockups/v1_transactions.html` — exists; quality review deferred).
- [x] 9. Mockup Admin Overview (`mockups/v1_admin_dashboard.html` — exists, loads clean; quality review deferred).
     > **NOTE (2026-09-17, revised)**: `79cf26d` replaced the original 6 mockups with a 9-file set (`landing`, `user_dashboard`, `transactions`, `user_proxy_config`, `admin_dashboard`, `contact` + rewritten `login`/`signup`/`admin_users`). Steps 2,3,8,9 now map to real files. Equivalent UI is additionally being built directly in Next.js (`src/app/dashboard`, `src/app/user/sign-in`) with mock data per `04` Phase 3.
- [x] 10. Mockup Login Page (`mockups/v1_login.html` — rewritten in `79cf26d`; also live as `src/app/user/sign-in`).
- [x] 11. Mockup Signup Page (`mockups/v1_signup.html` — rewritten in `79cf26d`).
- [ ] 12. Mockup Password Reset Flow (HTML deleted in `79cf26d`; no Next.js route yet — `/user/forgot-password`, `/user/reset-password` pending).
- [ ] 13. Mockup User Settings / Profile Page (HTML deleted in `79cf26d`; `/profile` route pending).
- [x] 14. Mockup Admin: User Management Table (`mockups/v1_admin_users.html` — rewritten in `79cf26d`).
- [ ] 15. Mockup Admin: System Configuration Page (HTML deleted in `79cf26d`; admin config route pending).
- [ ] 16. Review Login/Signup UI with User.
- [ ] 17. Review Admin Management UI with User.
- [ ] 18. Final Approval of complete HTML suite.

## PHASE 2: Next.js Foundation & Environment

_Goal: Initialize the monorepo and secure the environment._

- [x] 19. Initialize Next.js 16 App Router workspace.
- [ ] 20. Strip default Next.js boilerplate css and layout.
- [x] 21. Install Tailwind CSS v4 (CSS-first `@theme` in `app/globals.css` — NO `tailwind.config.ts`, which does not exist in v4).
- [x] 22. Define custom color palette (Obsidian, Cyan, Amber, Emerald) as `@theme` tokens in CSS, mapped from the `04` §1.2 brand tokens (Primary/Secondary/Success/Warning/Danger) — one token system, not two.
- [x] 23. Install HeroUI v3 (`@heroui/react` ONLY — NOT `@nextui-org/*`, NO Provider wrapper; v3 components work unwrapped).
- [x] 24. Install Framer Motion for UI animations (light use only — modal/drawer transitions; see `00` §1).
- [x] 25. Icons are `@gravity-ui/icons` (LOCKED aesthetic match — do NOT install Lucide).
- [x] 26. Setup `src/lib/env.ts` using Zod for strict ENV validation.
- [x] 27. Define `DATAIMPULSE_API_LOGIN` and `DATAIMPULSE_API_PASSWORD` in env vars.
- [x] 28. Define `MONGODB_URI` in env vars (no `JWT_SECRET` — sessions are Better Auth cookie sessions, not custom JWTs).
- [x] 29. Setup custom absolute import paths (`@/*`).
- [x] 30. Create global `layout.tsx` WITHOUT any UI Provider wrapper (HeroUI v3 needs none). Dark Mode default per design; do not force-remove user preference hooks reserved for later.

## PHASE 3: Atomic React Components (Design System)

_Goal: Build the reusable UI primitives._

- [x] 31. Build `<Button />` (`src/components/ui/Button.tsx` — Primary, Secondary, Danger, Ghost).
- [x] 32. Build `<GlassCard />` (Standard panel wrapper).
- [x] 33. Build `<TextInput />` with error state handling.
- [x] 34. Build `<PasswordInput />` with toggle visibility.
- [x] 35. Build `<SelectDropdown />` (`src/components/ui/SelectDropdown.tsx` — single select).
- [x] 36. Build `<MultiSelectCombobox />` (For State/City/Zip with search).
- [x] 37. Build `<ToggleSwitch />` (`src/components/ui/ToggleSwitch.tsx` — Sticky IP / protocols).
- [x] 38. Build `<StatusBadge />` (Active, Pending, Rejected, Suspended, Expired — locked vocabulary; never `Banned`).
- [x] 39. Build `<ProgressRing />` (`src/components/ui/ProgressRing.tsx` — bandwidth visualization).
- [x] 40. Build `<CopyBox />` (For clicking to copy credentials/URLs).
- [x] 41. Build `<Navbar />` (`src/components/ui/Navbar.tsx` — responsive, conditional auth states).
- [x] 42. Build `<Sidebar />` (`src/components/ui/Sidebar.tsx` — desktop sidebar + mobile bottom bar with More sheet).
- [x] 43. Build `<AdminSidebar />` (`src/components/ui/AdminSidebar.tsx` — basePath-driven, strictly and ONLY `/axiomshuvo`).
- [x] 44. Build `<ToastProvider />` (`src/components/ui/ToastProvider.tsx` — mount once + notify\* helpers).
- [x] 45. Build `<Modal />` wrapper (`src/components/ui/Modal.tsx` — ConfirmDialog; e.g. suspend-user confirmation, never "ban" vocabulary).

## PHASE 4: Database Infrastructure (MongoDB Native + Zod — NO Mongoose)

_Goal: Architect the data layer with strict protections. Schemas are Zod-validated documents per `02`; there are no Mongoose models._

- [x] 46. Install `mongodb` (Native driver) + `zod`. Do NOT install `mongoose`.
- [x] 47. Create `src/lib/mongodb.ts` connection manager (single shared `MongoClient`, global-cached across hot reloads).
- [x] 48. Implement global cached connection logic (prevent hot-reload leaks).
- [x] 49. Force `maxPoolSize: 10` in connection options (Hostinger/Free Tier safety).
- [x] 50. Implement connection error catching and auto-retry logic.

## PHASE 5: Zod Schemas & Collections (mirror `02` — field names below are LOCKED-SPEC)

_Goal: Define the strict data shapes. Every name here must match `02-DATABASE-ARCHITECTURE.md`; on drift, `02` wins. No Mongoose — Zod schemas + Native driver._

- [x] 51. `users` (Better Auth identity + business fields): `publicUserId` (CSPRNG `PX-` + Crockford Base32, unique index; never sequential).
- [x] 52. `users`: `email` (immutable via self-service, unique).
- [x] 53. Auth credentials live in Better Auth's `accounts`/`sessions`/`verification_tokens` collections — NO local `passwordHash` field anywhere.
- [x] 54. `users`: `role` (`ROLE_ADMIN` | `ROLE_USER`) + `capabilities` (e.g. `CAPABILITY_AFFILIATE`).
- [x] 55. `users`: `status` (`ACTIVE` | `SUSPENDED` | `DEACTIVATED`) — never `isBanned`.
- [x] 56. `proxy_accounts`: one row per `(userId, providerId, proxyType)` across the 4-pool enum → upstream int `providerSubUserId`, `poolTypeRaw`, AES-256-GCM `password` blob (replaces any single-`dataImpulseSubUserId` draft).
- [x] 57. `transactions`: `userId` ref + `type` (`PURCHASE` | `REDEEM` | `ADMIN_ADJUSTMENT`).
- [x] 58. `transactions`: 9-status machine per `01` §16.2 (never invented statuses).
- [x] 59. `transactions`: `bandwidthBytes` + full `*Bdt` pricing snapshot + `poolCoefficient`/`filterMultiplier` + `trafficAddedGb`/`balanceChargedGb`.
- [x] 60. `transactions`: `paymentReference` (sparse unique) + `senderNumber` + `timestamps{createdAt,approvedAt,activatedAt,expiredAt}`.
- [x] 61. Index pass: unique `(userId,providerId,proxyType)`, `(couponId,transactionId)`, `(transactionId,operationType)`, `(transactionId)` on commissions, `(referredUserId)` on referrals, upsert key on metadata (per `02` §32) — done in `scripts/apply-indexes.js` (2026-09-18 fix pass; also covers tx `transactionId`/`status+createdAt`, coupons/redeem/affiliate-code uniques, op-log sweeper).
- [x] 62. `proxy_configurations`: 1:1 with `proxy_accounts` (`proxyAccountId` unique) — mode/mode-ports, country + 2x filters, exclude-ASN, threads/rotation/anonymous, `whitelistedIps` (move semantics), `consentForSupportView`.
- [ ] 63. Config targeting fields follow `03` §6 grammar inputs (country-first rule); the wire suffix itself is built ONLY by adapter `buildTargetingSuffix()` — NOT DONE: `src/lib/dataimpulse/` adapter is Phase 7 work, schema fields only exist so far.
- [x] 64. `protocol` (`http` | `socks5`, subset of live `supported-protocols/get`) + `mode` (`rotating` | `sticky`).
- [x] 65. `rotationInterval` + `anonymousFilter` passthrough + `stickyRange` mirror.
- [x] 66. `coupons`: `code` (unique, case-insensitive collation), `FIXED_AMOUNT`/`PERCENTAGE` + `maxDiscountAmount` cap.
- [x] 67. `coupons`: `bandwidthGb` scoping via `planId`/`userId` targeting (no `gbReward` pseudo-field).
- [ ] 68. `coupons`: `usageLimit` + `$inc`-only `usageCount` with `usageCount < usageLimit` guard in the approval transaction.
- [x] 69. `coupons`/`offers`/`redeem_codes`: `validFrom`/`validTo` + `createdAt`; `redeem_codes.status` 7-state machine (`src/lib/db/schema.ts`).
- [x] 70. `notifications`: `userId`, locked `type` enum (`02` §29), `title`, `message` (no secrets), `read`, 90-day TTL (`NotificationSchema`).
  - [x] 70a. `affiliate_profiles` / `affiliate_codes` (≤8 chars, case-insensitive unique) / `affiliate_referrals` (unique `referredUserId`, registration-only binding) / `affiliate_commissions` (unique `transactionId`, full snapshot) / `affiliate_payouts` (`receiptUrl`, `CUSTOM` + `customRange`).
  - [x] 70b. `provider_metadata` (upsert key `(providerId,poolType,countryCode)`, `syncedAt`) + `provider_sync_logs` + `provider_operation_logs` (unique `(transactionId,operationType)`, redacted payloads) + redacted `audit_logs`.

## PHASE 6: Authentication & Security Backend (Better Auth — NO custom JWT auth)

_Goal: Secure routes and manage sessions. Better Auth owns credentials/sessions; app code only checks `role`/`status`._

- [ ] 71. Install Better Auth (+ Google OAuth provider) per `01` §8. Do NOT install `jsonwebtoken`/`bcryptjs`/`jose` for app auth; no `src/lib/jwt.ts`, no custom password hashing (scrypt via Better Auth default).
- [ ] 72. Cookie-based sessions (HTTP-only); JWT plugin only if a third-party-token use case arises.
- [ ] 73. Build Next.js 16 `proxy.ts` route guard (NOT legacy `src/middleware.ts`): redirect unauthenticated from protected customer routes to `/user/sign-in`.
- [ ] 74. Guard logic: `ADMIN_PATH` (server env, never `NEXT_PUBLIC_`) + `user.role === 'ROLE_ADMIN'` check on every admin route/action — obscurity is deterrent only.
- [ ] 75. Suspended users: read-only quarantine (`403 Account Suspended` on checkout/redeem/generate); `DEACTIVATED` cannot log in.
- [ ] 76. Better Auth: email + password signup (Crockford `publicUserId` from CSPRNG + unique-index retry; email uniqueness enforced).
- [ ] 77. Password rules: OAuth "Set Password" (no current-password challenge) vs credential "Change Password" (current required); reset = single-use expiring LINK (`/user/reset-password?token=`), 1 request/user/day.
- [ ] 78. Registration with affiliate code binds first-touch attribution (`affiliate_referrals`, unique `referredUserId`); self-use earns zero.
- [ ] 79. Session revocation: suspend/deactivate deletes all Better Auth `sessions` rows + expires cookies (fail-closed sequence `01` §9.3).
- [ ] 80. Rate limits per `01` §24.1 minima (auth 5/min/IP + backoff; admin auth + alert); `429` + `Retry-After`.
- [ ] 81. `/api/auth/me` returns scrubbed user object (never sessions/tokens/secrets).
- [ ] 82. (Reserved — kept for numbering continuity; see Phase 5 for session storage.)
- [ ] 83. Logout clears Better Auth session server-side + expires cookie.
- [ ] 84. (Reserved — kept for numbering continuity.)
- [ ] 85. Audit: every auth lifecycle event (signup, login-anomaly, suspend, restore) writes redacted `audit_logs`.

## PHASE 7: DataImpulse API Adapter

_Goal: Core integration with the upstream provider._

- [x] 86. Create `src/lib/dataimpulse/client.ts`.
- [x] 87. Build `getAuthToken()` method handling API login and token caching.
- [x] 88. Build `createSubUser()` method.
- [x] 89. Build `deleteSubUser()` method.
- [x] 90. Build `getSubUserBalance()` method.
- [x] 91. Build `addSubUserBalance()` method.
- [x] 92. Build `setSubUserStatus(blocked)` method.
- [x] 93. Build `setDefaultPoolParameters()` method.
  > NOTE (2026-09-18 fix pass): all adapter wire shapes corrected to `03` (query-param `subuser_id`, `{subuser_id,traffic/blocked}` bodies, integer-GB validation, `drop`/`addition-history`/`reset-password` helpers). Plus: approval lifecycle rewritten to `PENDING→APPROVED→ALLOCATING→PROVIDER_VERIFIED→ACTIVE` with op-log idempotency, redeem to `PROCESSING→PROVIDER_ALLOCATED→USED`, suspend to fail-closed, engine ports to `823/824`, schema enums to spec.
- [ ] 94. **CONFIRMATION TEST**: run the `archive/06` §5 sandbox script (`traffic:1` → +1 GiB expected; fractional/zero handling; negative-subtract semantics). Default is already LOCKED to integer-GB in the adapter — this test confirms, not discovers.
- [ ] 95. Record results in `03` §9; `TRAFFIC_UNIT_MULTIPLIER = 1073741824` stays hardcoded regardless.
- [ ] 96. Implement adapter error handling (catching 400 NO_RAY, etc).

## PHASE 8: The Proxy Generator Engine (Frontend + Backend)

_Goal: Turn user selections into valid proxy credentials._

- [ ] 97. Build API: `GET /api/proxy/config` (fetch user's saved config).
- [ ] 98. Build API: `PUT /api/proxy/config` (save user's config).
- [ ] 99. UI Logic: Fetch config on Dashboard load.
- [ ] 100. UI Logic: Handle cascading selects (State clears City, etc).
- [ ] 101. UI Logic: Calculate if x2 High Precision filter is active based on state/city/zip length.
- [ ] 102. Engine Logic: build username suffix via adapter `buildTargetingSuffix()` using the canonical grammar in `03` §6 (`login__cr.de`, `login__cr.de,au`, `login__cr.de;city.berlin`, `login__sessid.123`). NEVER hand-concat; slug-validate all values.
- [ ] 103. Engine Logic: multi-value joins (`,` within a key, `;` across keys) per `03` §6; country-first validation before city/state/ZIP/ASN params.
- [ ] 104. Engine Logic: sticky sessions via dedicated ports `10000+` (from `sticky_range`) and/or `sessid` pin (30-min semantics per live docs) — both server-rendered from env, never hardcoded in components.
- [ ] 105. Engine Logic: Toggle `socks5://` vs `http://` scheme.
- [x] 106. Engine Logic: Construct final cURL output string dynamically.
- [ ] 107. Engine Logic: Construct basic Username:Password output dynamically.
- [x] 108. UI Logic: Implement "Copy to Clipboard" functionality for credentials.

## PHASE 9: Purchasing & Transactions Backend

_Goal: Secure financial tracking and verification._

- [x] 109. Build API: `GET /api/plans` (dynamic catalog from `plans` collection; out-of-stock plans flagged via coefficient-adjusted stock check — never static tiers).
- [x] 110. Build API: `POST /api/transactions/create` (Initiate purchase).
- [x] 111. API Logic: Validate incoming plan ID (must be `ACTIVE`; client sends `{planId, couponCode?, affiliateCode?, targetFilters?}` — never amounts).
- [x] 112. API Logic: Create DB record with `status: PENDING` + frozen price snapshot (LOCKED-SPEC `01` §16.2 machine — never invented statuses).
- [x] 113. Build API: `POST /api/transactions/redeem` (Coupon claim).
- [x] 114. API Logic: Check Coupon `validFrom`/`validTo` + plan/user binding (advisory preview only).
- [x] 115. API Logic: Atomic claim `ACTIVE → PROCESSING` + `transactions(type=REDEEM)` insert in ONE Mongo transaction (exactly-once under concurrency).
- [x] 116. API Logic: allocate via adapter, confirm with `balance/get`, then advance `PROCESSING → PROVIDER_ALLOCATED → USED` (never mark `USED` before proof; failure reverts to `ACTIVE`).
- [x] 117. API Logic: `REDEEM` transactions NEVER insert commissions (worker branch + test).
- [x] 118. Build API: `GET /api/transactions` (Customer history with pagination).

> NOTE (2026-09-18 — flex/volume pricing extension, `01` §13/§14 + `02` §11):
> plans gained `pricingMode: FIXED | TIERED` + embedded `tiers[]` (`src/lib/db/schema.ts`);
> `src/lib/pricing.ts` owns tier validation, quoting, and the buying-cost floor
> (`floor = ceil(wholesale × poolCoefficient)`, wholesale from `providers.costPerGbBdt`);
> checkout accepts `{planId, quantityGb}` for TIERED with server-side BELOW_COST reject;
> approval re-validates tier coverage/rate and aborts to PENDING on drift; admin UI at
> `ADMIN_PATH/plans` (buying-cost editor + tier editor with live validation/preview);
> customer `/user/plans` renders TIERED cards with tier table + GB stepper capped by
> `floor(resellerBalance / coefficient)`. All amounts integer BDT; commission/coupon/
> affiliate flows bind to the flex plan ID unchanged.
>
> NOTE (2026-09-18 — providers registry + full admin wiring):
> `providers` collection is now the registry (`ProviderDocSchema`: id, name, status,
> pools, single wholesale base, per-pool coefficients, gateway). DataImpulse auto-seeds
> ACTIVE with 4 pools + 823/824 gateway; future vendors sit DISABLED ("Coming Soon").
> Plans carry `providerId` (selector in modal, ACTIVE-gate + pool check + per-provider
> floor at save); checkout/approval/catalog all price off the plan's provider billing.
> Admin registry UI at `ADMIN_PATH/providers` (edit, per-pool billing rule, gateway,
> connection test). Public `/plans` marketing page (HeroUI Card/Button/Spinner) +
> shared `PlanExplorer` slider card used by both `/plans` and `/user/plans`.
> Admin wired end-to-end (zero mock rows): approvals queue + reason-required reject,
> users table (search/filter/suspend modal/grant-revoke) + `users/[publicUserId]` detail
> (inventory, ledger, partner, audit), coupons CRUD + usage drawer, affiliates ledger +
> email-invite grant, payouts with overpay guard + history, system settings editor,
> System Logs viewer (provider-ops + audit + 30d runtime logs, health strip: stock,
> storage vs 512 MB, email X/100) with emit hooks in email/adapter/approval/cron.
> Removed: `force-upgrade` + `seed` unauthenticated endpoints; passwords stripped from
> `/api/proxy/accounts`; DEACTIVATED login block; admin link is role-based.
>
> NOTE (2026-09-18 — P1 money paths VERIFIED 14/14 + user routes live):
> coupon best-discount pricing at checkout (offer vs coupon, tie→offer, % half-up,
> invalid codes 400 with reason); atomic claim at approval (unique usage row +
> CAS usageCount + one-time flip, idempotent retry, exhausted→abort); commission
> decision incl. explicit ৳0 (plan→affiliate→global hierarchy, floor rounding,
> profit-floor cap, self-use 0, Dhaka YYYY-MM, dup-tolerant); referral binding
> endpoint (?ref= at signup incl. OAuth round-trip) + partner code actions
> (≤8 chars, 3/day, active-cap, terminal disable). Verified live: 5GB×140−50=650
> order, bad-coupon 400, abort-to-PENDING on unreachable upstream with zero coupon
> consumption, 14/14 harness green (harness removed after). Two real bugs the
> harness caught and fixed: claim-retry order vs exhaustion check, ApprovalAbort
> vs FAILED misclassification. User routes now live: proxy-config (real accounts,
> reveal-once passwords, entitlement gates), transactions (scoped + pagination),
> affiliate (codes/history/balances), profile (identity/name/password/reset-link),
> forgot/reset wired, checkout→plans redirect, throttled contact tickets.
>
> NOTE (2026-09-18 — unified Codes area):
> `ADMIN_PATH/codes` replaces the coupon popup: segmented Redeem|Coupon tabs,
> inline forms, generator-only codes (no manual entry anywhere). Redeem mint:
> provider→pool→plan (auto-fills GB, editable 1–1000)→valuation→validity
> (default 30d); 16-char Crockford CSPRNG, masked list (full shown once + copy),
> disable action. Coupon mint: provider→plan cascade, type toggle, ৳10/20/30/50
> chips, % with cap, One-Time preselected, optional user bind (server-resolved),
> dates, limit. Old `/coupons` route redirects to `/codes`. Verified live:
> minted 5GB RESIDENTIAL code via UI → claimed as customer → clean revert to
> ACTIVE with zero ledger rows on dead upstream; test data removed after.
>
> NOTE (2026-09-18 — speed A+B):
> A: `optimizePackageImports: ["@heroui/react"]` + Turbopack for `next dev`
> (`dev:webpack` fallback kept; `build` stays `--webpack` so Serwist precaching is
> untouched). Measured: /plans first-compile 8.4s → 0.67s, warm 30ms.
> B: 60s single-flight reseller-balance cache (+10s negative cache) in the adapter;
> `/api/plans` catalog (plans + provider billing) in `unstable_cache` 5 min tagged
> `plans`, purged instantly via `updateTag` on plan/provider saves; `Cache-Control:
> public, s-maxage=60, stale-while-revalidate=300` on the response; SWR tuned
> (catalog/dashboard 60s dedupe, no focus refetch; approvals queue polls 15s guarded);
> approval now live-checks reseller stock (INSUFFICIENT_STOCK aborts to PENDING).
> Verified: repeated /api/plans hits ~5ms.

## PHASE 10: Admin Operations Backend

_Goal: Build the control plane for the owner._

- [x] 119. Build API: `GET /api/admin/stats` (Aggregate totals for Admin dashboard; on-the-fly under 100k txns, else `daily_stats` per `02` §45).
- [x] 120. API Logic: Query MongoDB for total users, total pending Tx, total revenue.
- [x] 121. Build API: `GET /api/admin/transactions/pending`.
- [x] 122. Build API: `POST /api/admin/transactions/:id/approve`.
- [x] 123. API Logic (Approve): Ensure current status is `PENDING` (status-precondition write); re-validate price/plan/coupon/stock — ANY drift aborts to `PENDING` with re-confirm event.
- [ ] 124. API Logic (Approve): flip `PENDING → APPROVED` + coupon atomic claim in ONE transaction, then enqueue the allocation WORKER (never call DataImpulse synchronously in the click handler): `APPROVED → ALLOCATING → PROVIDER_VERIFIED → ACTIVE` with idempotency key = transactionId.
- [ ] 125. API Logic (Approve): commission decision (incl. explicit ৳0) inserted in the same txn as `PROVIDER_VERIFIED → ACTIVE`; `REDEEM`/`ADMIN_ADJUSTMENT` excluded.
- [ ] 126. API Logic: Trigger in-app notification to user (+ email ONLY within the `01` §32 allowlist).
- [ ] 127. Build API: `POST /api/admin/transactions/:id/reject` (reason REQUIRED — dropdown + note).
- [ ] 128. Build API: `GET /api/admin/users` (List all users + search by email/`publicUserId`).
- [ ] 129. Build API: `POST /api/admin/users/:id/suspend` (fail-closed: `set-blocked=true` on ALL sub-users FIRST, then sessions revoke, then DB flip — `01` §9.3; restore reverses).
- [ ] 130. API Logic (Suspend): never flip DB before provider confirms; retry queue + admin alert on provider failure.
- [ ] 131. API Logic: `reset-password` rotation endpoint (rate-limited) + drop-before-delete deprovision (dual-confirmed).
- [ ] 132. Build API: `POST /api/admin/users/:id/add-balance` (Manual override → `ADMIN_ADJUSTMENT` ledger row, audit-logged).
- [ ] 133. Build API: `POST /api/admin/coupons` (promo coupons) SEPARATE from affiliate-code issuance (referral codes live under the affiliate flow — never conflate the two).

## PHASE 11: In-App Notifications & Email System (Strict Mode)

_Goal: Handle messaging without hitting the 100/day SMTP limit._

- [x] 134. Install `nodemailer`.
- [x] 135. Configure SMTP transport for Hostinger.
- [x] 136. Create `src/lib/notifications.ts` (DB Inbox creator).
- [x] 137. Create `src/lib/email.ts` (SMTP sender).
- [x] 138. Hook: Create DB notification on Purchase Initiated.
- [x] 139. Hook: Create DB notification on Purchase Approved.
- [x] 140. Hook: Create DB notification on Purchase Rejected.
- [x] 140b. Hook: Admin Broadcast Engine (`createAdminNotification`).
- [x] 140c. Hook: System Broadcasts on Contact form, Manual Order, Affiliate requests.
- [x] 140d. Global Admin UI Badges: SWR implementation inside AdminShell for live sidebar badge counts.
- [x] 140e. Notification Deep Linking: Routing via `targetUrl` parameter.
- [x] 140f. Global Toast Migration: Transitioned to native HeroUI v3 Toasts.
- [x] 141. Build API: `POST /api/auth/forgot-password`.
- [x] 142. Rate Limit Check: Ensure user has not requested reset in last 24h.
- [x] 143. API Logic: Generate secure reset token, save to DB with expiry.
- [x] 144. Email Logic: Send Reset Password Email (allowlist item 1 — counts toward 100/day; 1 request/user/day).
- [x] 145. Build Cron: `GET /api/cron/daily-summary` (Secured by secret header; needs an external pinger on Hostinger — PM2 has no built-in cron runner).
- [x] 146. Cron Logic: Aggregate daily sales/users.
- [x] 147. Cron Logic: Send summary email to Admin (allowlist item 3 — 1/day).
- [x] 148. Build Cron/Hook: Low Data Warning (allowlist item 2 — threshold-triggered ONLY, debounced daily; in-app feed always, email only on threshold cross).

## PHASE 12: Customer Frontend Integration (React Query)

_Goal: Wire up the React UI to the API routes._

- [x] 149. Install `swr` or React Query for data fetching.
- [ ] 150. Build `/dashboard` page data hooks (Fetch Config, Fetch Balance).
- [ ] 151. Wire up Generator UI to `PUT /api/proxy/config` with debouncing.
- [ ] 152. Build `/plans` + `/checkout` page form logic (Select plan, enter bKash/Nagad ref) — locked routes are `/user/sign-in`, `/user/sign-up`, `/plans`, `/checkout` (never `/login`, `/register`, `/buy`).
- [ ] 153. Wire up Checkout submit button to `POST /api/transactions/create`.
- [ ] 154. Implement loading states for checkout buttons.
- [ ] 155. Build `/transactions` page data grid (Fetch history).
- [ ] 156. Build `<Inbox />` component to show in-app DB notifications.
- [ ] 157. Wire up Navbar avatar dropdown (Logout, Profile).
- [ ] 158. Build `/user/sign-in` form logic (Zod client-side validation).
- [ ] 159. Build `/user/sign-up` form logic (Zod client-side validation).

## PHASE 13: Admin Frontend Integration

_Goal: Wire up the Admin control panel. All admin routes live under `ADMIN_PATH` (server env — strictly and ONLY `/axiomshuvo`; see `01` §8.2)._

- [x] 160. Build `ADMIN_PATH` dashboard overview (Fetch stats).
- [x] 160b. Build `axiomshuvo/tickets` admin UI to read/manage contact form messages without relying on SMTP.
- [ ] 161. Implement Storage Warning progress bar based on DB size API.
- [ ] 162. Build `axiomshuvo/approvals` queue data table (cost preview, dup-TrxID blocking, retry — per `04` §4.2).
- [ ] 163. Wire up "Approve" button with confirmation modal and loading state (enqueues worker — never synchronous allocation).
- [ ] 164. Wire up "Reject" button (mandatory reason).
- [ ] 165. Build `axiomshuvo/users` management table.
- [ ] 166. Wire up User Search functionality (email + `publicUserId`).
- [ ] 167. Wire up "Suspend/Restore" + "Rotate Credentials" buttons (fail-closed sequences `01` §9.3; Danger confirmation modal).
- [ ] 168. Build `axiomshuvo/coupons` creation form (promo coupons; affiliate codes are a separate flow).

## PHASE 14: Security Hardening & Edge Cases

_Goal: Ensure system survives abuse._

- [x] 169. Audit: Check all `$inc` MongoDB operations for atomicity (coupon `usageCount` guard, `cumulativePurchasedBytes` — always with preconditions, inside transactions where ledger rows are co-written).
- [x] 170. Audit: Verify Better Auth session handling (DB rows + cookie expiry on suspend/deactivate; no custom JWTs to expire).
- [x] 171. Audit: Ensure API routes return 401/403 properly.
- [x] 172. Audit: Verify users cannot view other users' transactions (`where userId = req.user.id`).
- [x] 173. Install `helmet` or equivalent Next.js security headers.
- [x] 174. Set up strict CORS policy.
- [x] 175. Verify sparse index on `paymentReference` prevents duplicate TrxID submissions.
- [x] 176. Implement frontend throttling on Proxy Config saves (prevent API spam).
- [x] 177. Handle DataImpulse 500 errors gracefully without exposing stack traces.
- [x] 178. Handle Hostinger SMTP connection failures gracefully.
- [x] 178b. Secure Route Guard (`proxy.ts`): Correct logic order to bounce logged-in users away from auth pages.
- [x] 178c. Security: Externalize Avatar uploads to ImgBB to protect MongoDB 512MB limits.

## PHASE 15: Optimization & Cleanup

_Goal: Polish for production._

- [ ] 179. Run `npm run lint` and fix all warnings.
- [ ] 180. Run `tsc --noEmit` and resolve all TypeScript strict errors.
- [ ] 181. Optimize HeroUI component imports (tree-shaking).
- [ ] 182. Optimize fonts (next/font).
- [ ] 183. Check mobile responsiveness of Dashboard multi-selects.
- [ ] 184. Check mobile responsiveness of Admin data tables (horizontal scroll).
- [ ] 185. Verify Dark Mode consistency across all states.
- [x] 186. Configure `@serwist/next` (LOCKED PWA engine — NOT `next-pwa`) with `NetworkOnly` for `/api/*`, dashboard, proxy-config, transactions, redeem, auth routes.
- [ ] 187. Generate `manifest.json` with app icons and theme colors.
- [ ] 188. Build `<PWAInstallPrompt />` UI component (Mobile bottom-sheet or Top banner).
- [x] 189. Create custom 404 page.
- [x] 190. Create custom 500 error boundary.

## PHASE 16: Hostinger Deployment Prep

_Goal: Prepare the codebase for the Hostinger Node.js environment._

- [x] 191. Ensure `package.json` build/start scripts are strictly standard for Hostinger Git Connect.
- [x] 192. Document the exact Build Command (`npm run build`) and Start Command (`npm start`) needed for the Hostinger panel.
- [x] 193. Update `next.config.js` for deployment (`output: 'standalone'`).
- [x] 194. Document environment variables required in Hostinger panel.
- [x] 195. Write deployment script/readme for user.

## PHASE 17: Production Launch Checks

_Goal: Final verifications on live server._

- [ ] 196. Provide final `git commit` and `git push` commands for the USER to execute.
- [ ] 197. Deploy on Hostinger.
- [ ] 198. Verify MongoDB Free Tier connection establishes correctly.
- [ ] 199. Register a test user account.
- [ ] 200. Submit a dummy transaction (Test bKash TrxID).
- [ ] 201. Log in as Admin and Approve transaction.
- [ ] 202. Verify DataImpulse balance successfully increased.
- [ ] 203. Generate Proxy String on Dashboard.
- [ ] 204. (User executes) cURL the proxy string to confirm live IP routing works.
- [ ] 205. Verify geo-targeting suffix routes correctly (e.g. `__cr.de` exits via Germany — confirm with `api.ipify.org` through the proxy).
- [ ] 206. Project Handover.
