# ProxyData Massive Execution Master Workplan (200+ Steps)

> **Doc precedence**: `01` + `02` + `03` + `04` are normative. This workplan is the execution checklist ONLY — on any conflict, the four plan docs win (see `00` §4). steps marked **[LOCKED-SPEC]** quote the binding rule inline so agents never follow a stale paraphrase.

This is the exhaustive, atomic-level roadmap for developing ProxyData from UI conception to Hostinger production deployment.

## CORE EXECUTION RULE: GIT COMMITS

The AI executing this plan must **NEVER** push to GitHub automatically.
After completing a Phase the AI must stop, review the changes, and output a clean, formatted `git commit -m "..."` command for the user to run. The user retains full control over pushing code.

## PHASE 1: HTML/Tailwind Prototyping & AI Review (Current Phase)

_Goal: Perfect the visual language before writing business logic._

- [x] 1. Initial UI System architecture documentation.
- [ ] 2. Mockup Public Landing Page (`v1_proxydata_landing.html`).
- [ ] 3. Mockup Customer Dashboard structure (`v1_proxydata_dashboard.html`).
- [ ] 4. Refine Dashboard to Obsidian/Cyan glassmorphism aesthetic.
- [ ] 5. Implement multi-select badge UI for City/Zip/ASN in HTML.
- [ ] 6. Implement dynamic connection string preview in HTML.
- [ ] 7. Mockup Buy Proxies / Checkout view (`v1_proxydata_buy.html`).
- [ ] 8. Mockup Transaction History view (`v1_proxydata_transactions.html`).
- [ ] 9. Mockup Admin Overview (`v1_proxydata_admin.html`).
> **NOTE (2026-09-17)**: no `v1_*.html` files exist in the workspace — steps 2–9 flipped back to `[ ]` (were falsely `[x]`). DECISION: per doc precedence (`04` wins over `05`), raw HTML mockups are SKIPPED — equivalent UI will be built directly in Next.js with mock data (`04` Phase 3). Steps 10–18 map to Next.js routes instead of `.html` files.
- [x] 10. Mockup Login Page (`mockups/v1_login.html`).
- [x] 11. Mockup Signup Page (`mockups/v1_signup.html`).
- [x] 12. Mockup Password Reset Flow (`mockups/v1_password_reset.html` — request + reset views).
- [x] 13. Mockup User Settings / Profile Page (`mockups/v1_settings.html`).
- [x] 14. Mockup Admin: User Management Table (`mockups/v1_admin_users.html`).
- [x] 15. Mockup Admin: System Configuration Page (`mockups/v1_admin_config.html`).
- [ ] 16. Review Login/Signup UI with User.
- [ ] 17. Review Admin Management UI with User.
- [ ] 18. Final Approval of complete HTML suite.

## PHASE 2: Next.js Foundation & Environment

_Goal: Initialize the monorepo and secure the environment._

- [ ] 19. Initialize Next.js 16 App Router workspace.
- [ ] 20. Strip default Next.js boilerplate css and layout.
- [ ] 21. Install Tailwind CSS v4 (CSS-first `@theme` in `app/globals.css` — NO `tailwind.config.ts`, which does not exist in v4).
- [ ] 22. Define custom color palette (Obsidian, Cyan, Amber, Emerald) as `@theme` tokens in CSS, mapped from the `04` §1.2 brand tokens (Primary/Secondary/Success/Warning/Danger) — one token system, not two.
- [ ] 23. Install HeroUI v3 (`@heroui/react` ONLY — NOT `@nextui-org/*`, NO Provider wrapper; v3 components work unwrapped).
- [ ] 24. Install Framer Motion for UI animations (light use only — modal/drawer transitions; see `00` §1).
- [ ] 25. Icons are `@gravity-ui/icons` (LOCKED aesthetic match — do NOT install Lucide).
- [ ] 26. Setup `src/lib/env.ts` using Zod for strict ENV validation.
- [ ] 27. Define `DATAIMPULSE_API_LOGIN` and `DATAIMPULSE_API_PASSWORD` in env vars.
- [ ] 28. Define `MONGODB_URI` in env vars (no `JWT_SECRET` — sessions are Better Auth cookie sessions, not custom JWTs).
- [ ] 29. Setup custom absolute import paths (`@/*`).
- [ ] 30. Create global `layout.tsx` WITHOUT any UI Provider wrapper (HeroUI v3 needs none). Dark Mode default per design; do not force-remove user preference hooks reserved for later.

## PHASE 3: Atomic React Components (Design System)

_Goal: Build the reusable UI primitives._

- [ ] 31. Build `<Button />` (Primary, Secondary, Danger, Ghost variants).
- [ ] 32. Build `<GlassCard />` (Standard panel wrapper).
- [ ] 33. Build `<TextInput />` with error state handling.
- [ ] 34. Build `<PasswordInput />` with toggle visibility.
- [ ] 35. Build `<SelectDropdown />` (Single select).
- [ ] 36. Build `<MultiSelectCombobox />` (For State/City/Zip with search).
- [ ] 37. Build `<ToggleSwitch />` (For Sticky IP / Protocols).
- [ ] 38. Build `<StatusBadge />` (Active, Pending, Rejected, Suspended, Expired — locked vocabulary; never `Banned`).
- [ ] 39. Build `<ProgressRing />` (For bandwidth visualization).
- [ ] 40. Build `<CopyBox />` (For clicking to copy credentials/URLs).
- [ ] 41. Build `<Navbar />` (Responsive, conditional auth states).
- [ ] 42. Build `<Sidebar />` (Customer layout).
- [ ] 43. Build `<AdminSidebar />` (Admin layout).
- [ ] 44. Build `<ToastProvider />` for system notifications.
- [ ] 45. Build `<Modal />` wrapper for popups (e.g., Ban User confirmation).

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
- [ ] 61. Index pass: unique `(userId,providerId,proxyType)`, `(couponId,transactionId)`, `(transactionId,operationType)`, `(transactionId)` on commissions, `(referredUserId)` on referrals, upsert key on metadata (per `02` §32).
- [x] 62. `proxy_configurations`: 1:1 with `proxy_accounts` (`proxyAccountId` unique) — mode/mode-ports, country + 2x filters, exclude-ASN, threads/rotation/anonymous, `whitelistedIps` (move semantics), `consentForSupportView`.
- [x] 63. Config targeting fields follow `03` §6 grammar inputs (country-first rule); the wire suffix itself is built ONLY by adapter `buildTargetingSuffix()`.
- [x] 64. `protocol` (`http` | `socks5`, subset of live `supported-protocols/get`) + `mode` (`rotating` | `sticky`).
- [x] 65. `rotationInterval` + `anonymousFilter` passthrough + `stickyRange` mirror.
- [x] 66. `coupons`: `code` (unique, case-insensitive collation), `FIXED_AMOUNT`/`PERCENTAGE` + `maxDiscountAmount` cap.
- [x] 67. `coupons`: `bandwidthGb` scoping via `planId`/`userId` targeting (no `gbReward` pseudo-field).
- [ ] 68. `coupons`: `usageLimit` + `$inc`-only `usageCount` with `usageCount < usageLimit` guard in the approval transaction.
- [ ] 69. `coupons`/`offers`/`redeem_codes`: `validFrom`/`validTo` + `createdAt`; `redeem_codes.status` 7-state machine.
- [ ] 70. `notifications`: `userId`, locked `type` enum (`02` §29), `title`, `message` (no secrets), `read`, 90-day TTL.
  - [ ] 70a. `affiliate_profiles` / `affiliate_codes` (≤8 chars, case-insensitive unique) / `affiliate_referrals` (unique `referredUserId`, registration-only binding) / `affiliate_commissions` (unique `transactionId`, full snapshot) / `affiliate_payouts` (`receiptUrl`, `CUSTOM` + `customRange`).
  - [ ] 70b. `provider_metadata` (upsert key `(providerId,poolType,countryCode)`, `syncedAt`) + `provider_sync_logs` + `provider_operation_logs` (unique `(transactionId,operationType)`, redacted payloads) + redacted `audit_logs`.

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

- [ ] 86. Create `src/lib/dataimpulse/client.ts`.
- [ ] 87. Build `getAuthToken()` method handling API login and token caching.
- [ ] 88. Build `createSubUser()` method.
- [ ] 89. Build `deleteSubUser()` method.
- [ ] 90. Build `getSubUserBalance()` method.
- [ ] 91. Build `addSubUserBalance()` method.
- [ ] 92. Build `setSubUserStatus(blocked)` method.
- [ ] 93. Build `setDefaultPoolParameters()` method.
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
- [ ] 106. Engine Logic: Construct final cURL output string dynamically.
- [ ] 107. Engine Logic: Construct basic Username:Password output dynamically.
- [ ] 108. UI Logic: Implement "Copy to Clipboard" functionality for credentials.

## PHASE 9: Purchasing & Transactions Backend

_Goal: Secure financial tracking and verification._

- [ ] 109. Build API: `GET /api/plans` (dynamic catalog from `plans` collection; out-of-stock plans flagged via coefficient-adjusted stock check — never static tiers).
- [ ] 110. Build API: `POST /api/transactions/create` (Initiate purchase).
- [ ] 111. API Logic: Validate incoming plan ID (must be `ACTIVE`; client sends `{planId, couponCode?, affiliateCode?, targetFilters?}` — never amounts).
- [ ] 112. API Logic: Create DB record with `status: PENDING` + frozen price snapshot (LOCKED-SPEC `01` §16.2 machine — never invented statuses).
- [ ] 113. Build API: `POST /api/transactions/redeem` (Coupon claim).
- [ ] 114. API Logic: Check Coupon `validFrom`/`validTo` + plan/user binding (advisory preview only).
- [ ] 115. API Logic: Atomic claim `ACTIVE → PROCESSING` + `transactions(type=REDEEM)` insert in ONE Mongo transaction (exactly-once under concurrency).
- [ ] 116. API Logic: allocate via adapter, confirm with `balance/get`, then advance `PROCESSING → PROVIDER_ALLOCATED → USED` (never mark `USED` before proof; failure reverts to `ACTIVE`).
- [ ] 117. API Logic: `REDEEM` transactions NEVER insert commissions (worker branch + test).
- [ ] 118. Build API: `GET /api/transactions` (Customer history with pagination).

## PHASE 10: Admin Operations Backend

_Goal: Build the control plane for the owner._

- [ ] 119. Build API: `GET /api/admin/stats` (Aggregate totals for Admin dashboard; on-the-fly under 100k txns, else `daily_stats` per `02` §45).
- [ ] 120. API Logic: Query MongoDB for total users, total pending Tx, total revenue.
- [ ] 121. Build API: `GET /api/admin/transactions/pending`.
- [ ] 122. Build API: `POST /api/admin/transactions/:id/approve`.
- [ ] 123. API Logic (Approve): Ensure current status is `PENDING` (status-precondition write); re-validate price/plan/coupon/stock — ANY drift aborts to `PENDING` with re-confirm event.
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

- [ ] 134. Install `nodemailer`.
- [ ] 135. Configure SMTP transport for Hostinger.
- [ ] 136. Create `src/lib/notifications.ts` (DB Inbox creator).
- [ ] 137. Create `src/lib/email.ts` (SMTP sender).
- [ ] 138. Hook: Create DB notification on Purchase Initiated.
- [ ] 139. Hook: Create DB notification on Purchase Approved.
- [ ] 140. Hook: Create DB notification on Purchase Rejected.
- [ ] 141. Build API: `POST /api/auth/forgot-password`.
- [ ] 142. Rate Limit Check: Ensure user has not requested reset in last 24h.
- [ ] 143. API Logic: Generate secure reset token, save to DB with expiry.
- [ ] 144. Email Logic: Send Reset Password Email (allowlist item 1 — counts toward 100/day; 1 request/user/day).
- [ ] 145. Build Cron: `GET /api/cron/daily-summary` (Secured by secret header; needs an external pinger on Hostinger — PM2 has no built-in cron runner).
- [ ] 146. Cron Logic: Aggregate daily sales/users.
- [ ] 147. Cron Logic: Send summary email to Admin (allowlist item 3 — 1/day).
- [ ] 148. Build Cron/Hook: Low Data Warning (allowlist item 2 — threshold-triggered ONLY, debounced daily; in-app feed always, email only on threshold cross).

## PHASE 12: Customer Frontend Integration (React Query)

_Goal: Wire up the React UI to the API routes._

- [ ] 149. Install `swr` or React Query for data fetching.
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

_Goal: Wire up the Admin control panel. All admin routes live under `ADMIN_PATH` (server env — never literal `/admin`; see `01` §8.2)._

- [ ] 160. Build `ADMIN_PATH` dashboard overview (Fetch stats).
- [ ] 161. Implement Storage Warning progress bar based on DB size API.
- [ ] 162. Build `ADMIN_PATH/approvals` queue data table (cost preview, dup-TrxID blocking, retry — per `04` §4.2).
- [ ] 163. Wire up "Approve" button with confirmation modal and loading state (enqueues worker — never synchronous allocation).
- [ ] 164. Wire up "Reject" button (mandatory reason).
- [ ] 165. Build `ADMIN_PATH/users` management table.
- [ ] 166. Wire up User Search functionality (email + `publicUserId`).
- [ ] 167. Wire up "Suspend/Restore" + "Rotate Credentials" buttons (fail-closed sequences `01` §9.3; Danger confirmation modal).
- [ ] 168. Build `ADMIN_PATH/coupons` creation form (promo coupons; affiliate codes are a separate flow).

## PHASE 14: Security Hardening & Edge Cases

_Goal: Ensure system survives abuse._

- [ ] 169. Audit: Check all `$inc` MongoDB operations for atomicity (coupon `usageCount` guard, `cumulativePurchasedBytes` — always with preconditions, inside transactions where ledger rows are co-written).
- [ ] 170. Audit: Verify Better Auth session handling (DB rows + cookie expiry on suspend/deactivate; no custom JWTs to expire).
- [ ] 171. Audit: Ensure API routes return 401/403 properly.
- [ ] 172. Audit: Verify users cannot view other users' transactions (`where userId = req.user.id`).
- [ ] 173. Install `helmet` or equivalent Next.js security headers.
- [ ] 174. Set up strict CORS policy.
- [ ] 175. Verify sparse index on `paymentReference` prevents duplicate TrxID submissions.
- [ ] 176. Implement frontend throttling on Proxy Config saves (prevent API spam).
- [ ] 177. Handle DataImpulse 500 errors gracefully without exposing stack traces.
- [ ] 178. Handle Hostinger SMTP connection failures gracefully.

## PHASE 15: Optimization & Cleanup

_Goal: Polish for production._

- [ ] 179. Run `npm run lint` and fix all warnings.
- [ ] 180. Run `tsc --noEmit` and resolve all TypeScript strict errors.
- [ ] 181. Optimize HeroUI component imports (tree-shaking).
- [ ] 182. Optimize fonts (next/font).
- [ ] 183. Check mobile responsiveness of Dashboard multi-selects.
- [ ] 184. Check mobile responsiveness of Admin data tables (horizontal scroll).
- [ ] 185. Verify Dark Mode consistency across all states.
- [ ] 186. Configure `@serwist/next` (LOCKED PWA engine — NOT `next-pwa`) with `NetworkOnly` for `/api/*`, dashboard, proxy-config, transactions, redeem, auth routes.
- [ ] 187. Generate `manifest.json` with app icons and theme colors.
- [ ] 188. Build `<PWAInstallPrompt />` UI component (Mobile bottom-sheet or Top banner).
- [ ] 189. Create custom 404 page.
- [ ] 190. Create custom 500 error boundary.

## PHASE 16: Hostinger Deployment Prep

_Goal: Prepare the codebase for the Hostinger Node.js environment._

- [ ] 191. Ensure `package.json` build/start scripts are strictly standard for Hostinger Git Connect.
- [ ] 192. Document the exact Build Command (`npm run build`) and Start Command (`npm start`) needed for the Hostinger panel.
- [ ] 193. Update `next.config.js` for deployment (`output: 'standalone'`).
- [ ] 194. Document environment variables required in Hostinger panel.
- [ ] 195. Write deployment script/readme for user.


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
