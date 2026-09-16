# ProxyData — Plan Audit (Cross-Doc Bug Hunt)

> **Status**: REMEDIATED — all P0/P1 findings dispositioned in v1.1.0 (2026-09-17). This file is now the historical record + decision log; build from `01–04`.
> **Audited files (as of 2026-09-16)**:
> - `docs/01-PROJECT-REQUIREMENTS.md` (was 957 lines → now ~1010, v1.1.0)
> - `docs/02-DATAIMPULSE-API-AUDIT.md` (was 243 lines → now ~212, v1.1.0 rewritten)
> - `docs/03-DATABASE-ARCHITECTURE.md` (was 715 lines → now ~778, v1.1.0)
> - `docs/04-UI-PLAN.md` (was 142 lines → now ~148, v1.1.0)
> **Audit date**: 2026-09-16
> **Scope**: flows, security issues, logical errors, UI problems, cross-doc contradictions
> **Addendum 2026-09-17**: live API verification in `docs/06-DATAIMPULSE-API-VERIFICATION.md` (24 real endpoints, 9 missing from `02`, gateway + billing answers). All findings below were remediated — see Remediation Log at the end. A second recheck pass (2026-09-17) is logged after it.

---

## 0. Executive Summary

Docs are unusually thorough, but contain **launch-blocking contradictions** between PRD / API-audit / DB-arch / UI-plan.
Top risks: unverified traffic unit (GB vs Bytes), 3 variants of transaction enums, 2 incompatible redeem lifecycles, manual-payment replay, coupon race, price-lock ambiguity, city-targeting contradiction, suspension vs provider-block atomicity, session-revocation confusion.

Do not start backend build until P0 section is locked.

---

## P0 — Critical / Launch Blockers

### 1. Traffic unit unverified = catastrophic mis-allocation
- Location: `02-DATAIMPULSE-API-AUDIT.md:116`, `03-DATABASE-ARCHITECTURE.md:524`
- `balance/add { traffic: int }` — GB vs Bytes unknown.
- If guessed wrong: 1073741824x over/under allocation. Blocks all bandwidth math, `IProxyProvider.allocateBandwidth()`, `bandwidthBytes` storage, costing.
- Fix: run throwaway sub-user test in `02:119-126` BEFORE freezing schema. Hardcode `TRAFFIC_UNIT_MULTIPLIER` in adapter, never branch per-call.

### 2. Transaction `type` enum has 3 variants
- `01-PROJECT-REQUIREMENTS.md:786`: `PURCHASE_REQUEST | REDEEM_CODE | ADMIN_ADJUSTMENT`
- `03-DATABASE-ARCHITECTURE.md:186`: `PURCHASE | REDEEM | ADMIN_ADJUSTMENT`
- `03-DATABASE-ARCHITECTURE.md:620`: `PURCHASE, REDEEM, ADMIN_ADJUST`
- Fix: pick one. Suggested: `PURCHASE | REDEEM | ADMIN_ADJUSTMENT`.

### 3. Transaction `status` enum has 3 variants
- `01:650-671` flow: `PENDING → APPROVED → ALLOCATING → PROVIDER_VERIFIED → ACTIVE` + `REJECTED/CANCELLED/EXPIRED/FAILED`
- `01:795`: `PENDING|APPROVED|REJECTED|CANCELLED|EXPIRED|ACTIVE|FAILED` — missing `ALLOCATING`, `PROVIDER_VERIFIED`
- `03:200`: `PENDING,APPROVED,ALLOCATING,PROVIDER_VERIFIED,ACTIVE,REJECTED,EXPIRED,FAILED` — missing `CANCELLED`
- `01:231` mentions `APPROVED_PENDING_ALLOCATION`, never defined elsewhere.
- `03:210` expiry cron only handles `PENDING → EXPIRED`. What expires stuck `ALLOCATING`? Needs retry/timeout + reconciliation cron.

### 4. Redeem lifecycle has 2 incompatible machines
- `01:701`: `GENERATED → ACTIVE → USED` / `→ EXPIRED/DISABLED`
- `03:216-226`: `ACTIVE → PROCESSING → PROVIDER_ALLOCATED → USED` with atomic `findOneAndUpdate({status:'ACTIVE'}→'PROCESSING')`
- `01:708` still says `PENDING_DATABASE_DESIGN` while `03` already designed it.
- Fix: lock to DB design, update PRD. Decide: does `REDEEM` also create a `transactions` row? Currently `redeem_codes` + `transactions(type=REDEEM)` diverge.

### 5. Manual payment replay — no TrxID uniqueness
- Location: `01:645`, `04-UI-PLAN.md:118` — user submits `{senderNumber, TrxID}`, admin verifies by eye.
- Missing: unique index on `paymentReference`, amount-match check, sender-number match.
- Attack: same bKash TrxID reused for 2 orders by 2 users.
- Fix: `transactions.paymentReference` sparse unique, admin UI “possible duplicate TrxID” warning, reject if `finalAmount != paidAmount`. Require reject-reason.

### 6. Coupon / one-time race
- Location: `03:242-266` — `isOneTime → INACTIVE after first use` + separate `coupon_usages`.
- Two concurrent `PENDING` checkouts can both pass validation during 7-day window, both get approved.
- Fix: atomic `findOneAndUpdate` coupon claim at **approval** time (not submission), unique index `(couponId, transactionId)`, `usageCount` with `$inc` guard `usageCount < usageLimit`.

### 7. Price-lock time undefined
- Offer/coupon best-discount rule defined (`01:632-636`, `03:269-272`, tie → Offer wins), but WHEN locked — submission or approval 7 days later?
- `03:536` snapshot shape drifts from `03:616-630` (`baseAmount/discountAmount/finalAmount` vs `basePriceBdt/offerDiscountBdt/...`).
- Fix: snapshot at submission, re-validate at approval, abort if plan `INACTIVE` or price changed → require re-confirm.

### 8. City targeting contradiction
- `02:183,229`: city targeting **absent** from Reseller API.
- `01:742,759` + `01:394-396` still require City dropdown + `fetchLocationMetadata()->{cities}`.
- `03:410-416` `provider_metadata` only stores `countryCode/countryName/count` — no city, no ASN.
- Fix: remove City from PRD/UI/interface or gate behind feature flag. Clarify ASN `exclude_asn` (exclude) vs UI-implied include.

### 9. Suspension ≠ provider block atomicity
- `01:259-266,356`: suspend → read-only + terminating proxy permissions. `02:81`: `set-blocked` enactment.
- No order/rollback: Mongo `SUSPENDED` ok + `set-blocked` timeout = user keeps proxy while UI says suspended.
- Fix fail-closed: `set-blocked=true` for ALL `proxy_accounts` first, then DB suspend, with retry queue + `provider_operation_logs`. Same for restore/deactivate.

### 10. Session revocation confusion
- `01:843`: “active JWT sessions are flagged”.
- `01:276`: primary is cookie-based Better Auth sessions, JWT only if needed.
- Fix: spec exact Better Auth admin call — delete `sessions` rows + clear cookies on suspend/deactivate.

---

## P1 — Security Issues

1. **Single admin, no 2FA, no compensating control.** `01:159,289` defers 2FA. Add login throttling, admin-login alert email, optional IP allowlist, `ADMIN_PATH` rate-limit. Keep note `01:308` obscured path is NOT a boundary — correct.
2. **Redeem code entropy unspecified.** Affiliate `≤8 chars` (`01:467`). Redeem `code` format/length missing (`03:214`). 8-char is brute-forceable. Spec ≥12 chars Crockford Base32, `crypto.randomBytes`, rate-limit per IP+user (`01:844` needs numbers).
3. **Proxy password handling.** `03:546,698` AES-256 at rest, decrypted for display. Missing key location/rotation/audit. `04:100-102` prints `Host:Port:User:Pass` in DOM. Add masking by default, reveal-once, never log, redact from `audit_logs.changes` (`01:861`) and `provider_operation_logs.payload` (`03:710`).
4. **DataImpulse token cache.** `02:23` 24h JWT cached+refreshed. Where? Memory breaks multi-instance; DB plaintext leaks. Spec server-only memory with lock or encrypted row, refresh at 20h, backoff, never leak upstream 401 to client.
5. **Gateway hardcode.** `01:880`, `03:549` `DATAIMPULSE_GATEWAY_HOST/PORT` manual env. Typo = traffic to attacker. Add startup assertion + health check.
6. **Audit log PII.** `01:856-861`, `03:433-441` store `ipAddress`, `changes`. No redaction. Exclude proxy passwords, auth tokens, TrxIDs (partial mask), OTPs.
7. **PWA over-caching.** `04:28` correctly requires online for transactions/proxy-config. Enforce Serwist `NetworkOnly` for `/api/*`, `/dashboard`, `/proxy-config`, never precache auth.
8. **Profile picture + contact form unspecced.** `01:440`, `04:66` — no bucket/size/MIME/AV. `uploads/` gitignored but no S3/Blob plan. Contact needs CAPTCHA + rate-limit.
9. **IP whitelist validation.** `02:200-204`, `03:403` max 5, no IPv4/IPv6/CIDR/private rules. Reject loopback/private, Zod-validate server-side.
10. **Affiliate self-referral.** No self-use ban. Add: block own code, flag same-IP/device, commissions ONLY on `type=PURCHASE + status=ACTIVE` — explicitly exclude `REDEEM`/`ADMIN_ADJUSTMENT` (`01:480` ambiguous).

---

## P1 — Flow / Logic Errors

1. **Attribution timing ambiguous.** `01:473` “registers OR checks out”. `03:298-305` `referredUserId` unique first-touch. Lock: bind at registration only; checkout code = discount only, never reattributes (matches `01:919`).
2. **Commission rounding.** `01:486-506`, `03:337-377` `৳30/5GB=৳6/GB`. Percentage coupons → fractions. BDT integer-only (`03:519-520`) with no rounding rule. Spec paisa-integer + rounding (floor / half-up). Handle fractional GB.
3. **Commission hierarchy mismatch.** `01:548-553` plan > affiliate > global vs `03:284-290` `{commissionAmountBdt, commissionBandwidthGb}` vs `system_settings.defaultCommissionPerGbBdt` (`03:450`). Two shapes, no conversion when units differ.
4. **Expiry “7–8 days” vague.** `01:125,679` vs `03:210` (7d) vs `03:449` (`pendingRequestExpiryDays:7`). Pick one int + cron interval + timezone. Affiliate `YYYY-MM` (`03:392`) — Dhaka vs UTC drifts month boundary.
5. **Oversell.** No reseller-balance precheck at submission/approval (`02:37` only monitor). Add block if `planGb > resellerBalance`, re-check at approval.
6. **`provider_metadata` full overwrite.** `03:565` overwrite every sync = read/write race. Use staging + atomic swap or upsert by `(providerId,poolType,countryCode)`.
7. **Dashboard N+1.** `01:336-337` total remaining = one `balance/get` per sub-user → rate-limit ban (`01:894` limits unknown). Use `cachedRemainingBalance` + TTL worker, never live fanout.
8. **Field-name drift (DB).** `03:136` `cumulativePurchased/cachedRemainingBalance/lastBalanceSyncAt` vs `03:607` `purchasedBytes` vs `03:648` example vs `03:188` `bandwidthBytes` vs `01:789` `bandwidthGb`. `03:536` vs `03:616-630` vs `03:654-674` snapshot names. Normalize to `*Bytes` + `*Bdt`.
9. **Missing unique indexes.** `coupon_usages(couponId, transactionId)`, `provider_operation_logs(transactionId, operationType)` (`03:715` check needs index), `transactions(paymentReference)` sparse unique.
10. **Notification purge vs disputes.** `03:566` purge 90d `PENDING_BUSINESS_DECISION`, but `02:150` needs history for disputes. Keep email receipts (`01:941-957`) permanent if in-app purged.
11. **`validityDays` with no enforcement.** `01:573` has it, `02:234` says DataImpulse has no expiry API, `01:893` open. UI shows expiry notice (`01:429`) for unbuilt backend. Implement clawback cron (`balance/drop` + `set-blocked`) or remove from UI.

---

## P2 — UI Problems (`04-UI-PLAN.md`)

- `04:68` auth “email OTPs” vs PRD reset links/tokens (`01:282-283`). OTP vs link must match; affects `verification_tokens`.
- `04:86` redeem modal on plans page vs standalone `/redeem` route (`04:45`). Pick canonical; modal+page duplicates validation.
- `04:85` plan cards “must include DataImpulse logo” — PRD `01:58-63` requires official logo/favicon. No asset pipeline (sizes, dark variant). Blocks legal compliance.
- `04:99` ASN as `Select` — hundreds of ASNs need searchable combobox + `exclude_asn` semantics (audit says exclude, UI implies include).
- `04:118` approval queue one-click Approve/Reject — no duplicate-TrxID warning, no mandatory reject-reason (needed for `04:132` toast + `01:810` notification).
- `04:46-51` mobile bottom nav 4 items (Dashboard/Plans/Proxy/Profile) but 8 routes — Transactions/Redeem/Affiliate orphaned. Add “More” drawer.
- Stack drift: `04:7` “Next 16+, Tailwind v4+, HeroUI v3+” + `04:14` no Provider + `04:22` `tailwind.config.ts` — Tailwind v4 has no `tailwind.config.ts` by default (CSS-first `@theme`). `.gitignore` header still says Next.js 15. Lock exact versions in `package.json` at init as `04:7` demands.

---

## P3 — Doc Hygiene

- Duplicate numbers: two `## 28` (`01:890` Open Questions + `01:941` Email & Notifications — second should be `## 32`); two `### 12.5` (`01:523` + `01:546`).
- Typo `01:174`: “HeroUI (formerly HeroUI)” → “HeroUI (formerly NextUI)”.
- `01:175`: “MongoDB (Native Driver / Mongoose)” — DB chose Native+Zod (`03:15`). Update PRD table.
- Password hashing `01:279`: “kept open” — mandate Better Auth default (scrypt), don’t roll own.
- `01:844` rate-limit: add numbers (checkout 10/min/user, redeem 5/min/user, coupon-validate 20/min/IP).
- `03:688`: “None currently block development” — false while traffic unit + expiry + token cache open.

---

## Suggested Fix Order

1. Live DataImpulse audit (units, rate limits, gateway host/port, `set-blocked`) — clears 12 `PENDING_API_AUDIT` rows.
2. Freeze enums: transaction type/status, redeem lifecycle, code formats.
3. Fraud guards: TrxID dedupe, coupon atomic claim, price-lock point, commission-on-PURCHASE-only, self-referral ban.
4. Ops: token cache, gateway validation, suspend-sequence, expiry cron + timezone, metadata swap, dashboard TTL.
5. Doc-cleanup pass (renumber, unify field names, lock versions), then regenerate.

---

## Remediation Log — 2026-09-17 (Senior Architect pass, v1.1.0)

Every item above was dispositioned; superficial prior patches that conflicted with live evidence were vetoed and replaced. Per-decision rationale (concurrency / security / scalability):

1. **Enums locked** (`01` §16.2/§17/§21, `03` §15–§17): 9-status txn machine incl. `CANCELLED` + `FAILED→ALLOCATING` retry + stale-`ALLOCATING`/`PROCESSING` sweepers; redeem `GENERATED→ACTIVE→PROCESSING→PROVIDER_ALLOCATED→USED` (+`EXPIRED`/`DISABLED`); 4-pool `proxyType`. Vetoed: triple-variant enums and the `GENERATED`-less DB machine — dual machines guarantee divergence under retry.
2. **Money locked** (`01` §10.2/§12.4/§14.1/§15.3, `03` §15/§40–§42): GB-integer edge, byte ledger, coefficient + 2x-filter cost formula, price frozen at submission + re-validated at approval, TrxID sparse-unique replay guard, coupon claim at approval in the same txn, commission floor with floor-rounding, `REDEEM`/`ADMIN_ADJUSTMENT` commission-excluded, self-use ban, Dhaka-month periods. Vetoed: whole-ledger 1:1 costing (would silently breach the profit floor on every mobile/premium/filtered order).
3. **Lifecycle locked** (`01` §9.3/§24, `03` §36–§37/§51): provider-first fail-closed suspend/restore, Better-Auth session-row revocation (no JWT-flag fiction), drop-before-delete deprovision, `reset-password` rotation, IP move-semantics for the global-uniqueness constraint, usage-detail privacy + 30d TTL, exp-driven single-flight token refresh, concrete rate limits, scrypt mandate, audit redaction. Vetoed: DB-flip-first suspend (leaves proxy live while UI claims quarantine) and blind `updateMany` expiry (races in-flight approvals — now per-doc claim).
4. **Schema locked** (`03`): `*Bytes` naming, `poolTypeRaw` + threads/sticky/rotation/anonymous fields, `trafficAddedGb`/`balanceChargedGb`/`poolCoefficient`/`filterMultiplier` per txn, `usageCount` + `(couponId,transactionId)`/`(transactionId,operationType)`/`paymentReference` unique keys, upsert metadata (never wipe), indefinite ledger vs 90d notifications vs 30d usage TTL.
5. **API audit rewritten** (`02` v1.1.0): all 24 live endpoints incl. 9 previously missing; gateway table; premium pool; 2x-filter model; negative-traffic server-only rule.
6. **UI plan corrected** (`04`): Tailwind v4 CSS-first (vetoed `tailwind.config.ts` — does not exist in v4), `proxy.ts`, link-only auth (vetoed OTP fiction — no such backend), canonical `/redeem`, move-semantics IP UX, cost/margin preview + mandatory reject reasons in the queue, `NetworkOnly` PWA cache boundary, upload/contact constraints, More-drawer nav.
7. **Hygiene**: `12.6` + `§32` renumbers, stack table, 7-day-UTC expiry, local `validityDays`+`expiryAction` enforcement (vetoed “remove from UI” — expiry is a business requirement; upstream never-expire is the reason local enforcement exists, not a reason to drop it), `.gitignore` stack comment.
8. **Vetoed prior-patch damage explicitly**: `finalAmountBdtBdt` typo, “City removed” (city works as a 2x connection param — the missing piece was the list endpoint, not the capability), `≥12-char affiliate codes with ≤8-char examples` (split correctly: affiliate ≤8 + throttling, redeem ≥12 + CSPRNG).

**Remaining pre-launch work is sandbox-only** (`02` §9, `06` §5): confirm pool strings, fractional-traffic rejection, real token TTL, 429 thresholds, delete balance fate. Nothing architectural remains open.

---

## Recheck Log — 2026-09-17, pass 2 (full re-read of `01–06`)

25 further drifts found and fixed (docs to v1.1.1):

- `01`: “three pools” note → four; affiliate-code length in scope summary → ≤8; metadata scope → countries + counts; diagram + principles → `proxy.ts`; city-list phrasing → countries-only (3 spots); Gravatar → constrained upload (was contradicting `04`); checkout affiliate-code semantics → inert (affiliate codes are not discounts); “Dhakar” typo; expiry “coupon holds” wording (nothing is held at `PENDING`); immutability shorthand → full machine; stack versions in §23.1; reconciliation cron removed from Future backlog (it is core — replaced with auto-top-up).
- `03`: deleted duplicated `## 33 Unique Constraints` (identical copy); metadata + provider capabilities → 4 pools; `costPerGbBdt` per-pool map added to provider doc; `discountSource` → includes `NONE`; payouts → `CUSTOM` + `customRange` defined + `receiptUrl`; notifications → locked type enum + TTL; audit logs → redaction + `ipAddress`.
- `04`: typography v4-compat note; referral manager limits; user-table action set; “payout Abel” typo.
- `05` header → remediated status (this file is history, not a build input).
- `06` → disposition header (§4 checklist done; evidence preserved).

No open design items. Build may proceed; only the 5 sandbox confirmations remain.
