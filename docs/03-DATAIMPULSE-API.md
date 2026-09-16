# DataImpulse API Audit (Live-Verified)

> **Version**: 1.1.0 — live-verified 2026-09-17
> **Method**: Postman collection JSON (`collectionId 6095389-565b6596-03a5-4ccc-a3dd-102bfe03692a`, 24 endpoints) + official docs (`docs.dataimpulse.com`). Evidence and test script: `archive/06-DATAIMPULSE-API-VERIFICATION.md`.
> Maps endpoints to `01-PROJECT-REQUIREMENTS.md` business rules. No `PENDING_VERIFICATION` remains except sandbox confirmations in §9.

**Source**: `https://documenter.getpostman.com/view/6095389/2s9YC7UC2x`
**Base URL**: `https://api.dataimpulse.com`

---

## 1. Authentication

### Get Token

- **Endpoint**: `/reseller/user/token/get`
- **Method**: `POST` (formdata: `login`, `password` = dashboard credentials from server env)
- **What it does**: Returns a JWT (`{ token }`). The live example token decodes to ~365d expiry — **do NOT hardcode 24h**.
- **ProxyData behavior (LOCKED)**: cache token server-side with its decoded `exp`; refresh at `min(exp − 1h, 20h)` with single-flight (one refresher per process; concurrent callers await it); on any upstream 401, re-auth exactly once and retry once, then fail closed. Never expose the token or 401 internals to clients.

---

## 2. Reseller Account

### Get Reseller Balance

- **Endpoint**: `/reseller/user/balance`
- **Method**: `GET`
- **Response**: `{ balance: 105 }` (GB number, reseller pool remainder).
- **Use**: admin stock display + submission/approval gate (`requestedGb × poolCoefficient × filterMultiplier > balance` → `INSUFFICIENT_STOCK`). Poll on demand + short TTL; never per-user fanout.

---

## 3. Sub-Users (Proxy Accounts)

Live collection confirms: `id` is an **integer**; every sub-user carries `login`/`password` (plaintext over TLS — encrypt at rest immediately); `pool_type` is locked at creation (adapter always sends it explicitly; tolerate upstream `residental` typo on read).

### List Sub-Users

- **Endpoint**: `/reseller/sub-user/list`
- **Method**: `GET`
- **Response**: `{ subusers: [{ id, label, login, password, balance, balance_format, threads, sticky_range:{start,end}, allowed_ips, blocked, pool_type, default_pool_parameters }] }`
- **Use**: reconciliation cron (diff local `proxy_accounts` vs upstream; detect drift, orphaned or missing sub-users). **Security**: response contains every password — server-only, never logged, never cached client-side.

### Create Sub-User

- **Endpoint**: `/reseller/sub-user/create`
- **Method**: `POST`
- **Body**: `{ label, pool_type, threads?, sticky_range? }` — `pool_type ∈ {residential, mobile, datacenter, premium_residential}` (4 pools; premium verified via deposit/pricing pages). The collection example omits `pool_type`; sandbox must confirm the exact accepted strings, but the adapter sends it always.
- **Response**: `{ id, login, password, balance: 0, threads, sticky_range, allowed_ips, blocked: false, ... }`
- **ProxyData rule**: 1 user + 1 pool type = 1 sub-user, enforced by unique `(userId, providerId, proxyType)`. Re-purchase reuses; never duplicates.

### Get Sub-User

- **Endpoint**: `/reseller/sub-user/get?subuser_id=`
- **Method**: `GET`
- **Use**: point-in-time verify (credentials recovery, blocked flag) — prefer `list` for bulk.

### Update Sub-User

- **Endpoint**: `/reseller/sub-user/update`
- **Method**: `POST` (`{ subuser_id, threads?, label?, ... }`; `pool_type` immutable)
- **Use**: thread/sticky adjustments only.

### Reset Password (credential rotation)

- **Endpoint**: `/reseller/sub-user/reset-password`
- **Method**: `POST` (`{ subuser_id }` → new `{ login, password }`)
- **Use**: user-requested rotation (rate-limited), post-leak rotation, post-restore rotation. Always re-encrypt + invalidate cached config strings + notify.

### Set Blocked (Enable/Disable)

- **Endpoint**: `/reseller/sub-user/set-blocked`
- **Method**: `POST` (`{ subuser_id, blocked }`)
- **Use**: suspend (`true`), restore (`false`), plan-expiry block. Runs FIRST in every fail-closed sequence (§01-§9.3).

### Set Blocked Hosts (domain denylist)

- **Endpoint**: `/reseller/sub-user/set-blocked-hosts`
- **Method**: `POST` (`{ subuser_id, blocked_hosts: [...] }`)
- **Decision**: NOT exposed to end users in v1 (abuse/filter-bypass vector). Reserved for admin compliance use with audit row. Revisit only with explicit policy.

### Delete Sub-User

- **Endpoint**: `/reseller/sub-user/delete`
- **Method**: `POST` (`{ subuser_id }` → `{ success: true }`)
- **Rule (LOCKED)**: only after `drop` + verified `balance == 0` + dual-confirmed admin action. Answers PRD §28-Q1: deletion EXISTS; suspension uses block, not delete.

---

## 4. Bandwidth / Data Management

Unit model (LOCKED): **`traffic` request unit = integer GB** (all live examples: `traffic: 2` → success; history `traffic_added: 1/2`); **balance fields = bytes** (`balance: 12900079458` = `12.01 GB`; `balance_total: 214748364800` = `200 GB`). Adapter converts at the edge (`bytes = gb × 1073741824`); ledger persists bytes. Sandbox confirmation script in `archive/06-DATAIMPULSE-API-VERIFICATION.md` §5 still required pre-launch (incl. fractional/zero rejection).

Billing coefficients (LOCKED, deposit doc): Residential **×1.0**, Datacenter **×0.5**, Mobile **×2.0**, Premium Residential **×5.0** — deducted from the reseller pool per allocated GB. Target-filter multiplier (targeting docs): state/city/ZIP/ASN-include **×2.0**, except premium pool (included, ×1.0); country/exclude-ASN stay ×1.0.

### Get Sub-User Balance (Remaining GB)

- **Endpoint**: `/reseller/sub-user/balance/get?subuser_id=`
- **Response**: `{ balance, balance_format, balance_total, balance_total_format, balance_used, balance_used_format, threads_used }`
- **Use**: authoritative remaining display (TTL-cached as `cachedRemainingBalance`); `PROVIDER_VERIFIED` gate compares `balance_total` delta. Map `threads_used` to capacity UI.

### Add Balance

- **Endpoint**: `/reseller/sub-user/balance/add`
- **Method**: `POST` (`{ subuser_id, traffic }`)
- **Notes**: NOT idempotent upstream — idempotency key is ProxyData `transactionId` + pre/post `balance/get` reconciliation (`02-DATABASE-ARCHITECTURE.md` §51). **Negative `traffic` subtracts** (per reseller guide) — reserved for server-side expiry/clawback with its own audit row; clients can never send negative values (Zod `min(1)`).

### Drop Balance

- **Endpoint**: `/reseller/sub-user/balance/drop`
- **Method**: `POST` (`{ subuser_id }`) — returns remainder to reseller pool.
- **Use**: refunds, `BLOCK_AND_RECLAIM` expiry, pre-delete zeroing.

### Addition History

- **Endpoint**: `/reseller/sub-user/balance/addition-history?subuser_id=`
- **Response**: `{ history: [{ balance_charged, traffic_added, datetime }] }`
- **Use**: reconciliation + disputes. Both values stored per transaction — their ratio IS the applied coefficient proof.

---

## 5. Usage & Statistics

### Get Usage Stat

- **Endpoint**: `/reseller/sub-user/usage-stat/get?subuser_id=&period=week|month|3months|6months`
- **Response**: `[{ traffic, request, d_usage }]` — dashboard charts.

### Get Usage Detail (privacy-gated)

- **Endpoint**: `/reseller/sub-user/usage-stat/detail?subuser_id=&period=&limit=&offset=`
- **Response**: per-request `{ host, datetime, requests, traffic, status, message }`.
- **Rule**: user sees ONLY own hosts; admin/support view requires explicit consent flag + audit; 30-day TTL, never in the indefinite ledger.

### Get Usage Errors (support)

- **Endpoint**: `/reseller/sub-user/usage-stat/errors?...`
- **Response**: `[{ datetime, error, host, port, count }]` (e.g. `HOST_BLOCKED`, `NO_HOST_CONNECTION`).
- **Use**: support diagnostics + `NO_RAY`/blocked-host UX copy. Same privacy rule as detail.

---

## 6. Proxy Configuration & Targeting

### Set Default Pool Parameters

- **Endpoint**: `/reseller/sub-user/set-default-pool-parameters`
- **Method**: `POST` (`{ subuser_id, default_pool_parameters: { countries, exclude_asn, anonymous_filter, rotation_interval } }`)
- Live schema includes `anonymous_filter` + `rotation_interval` — both surfaced in the config generator; city/state/ZIP are connection-time params, not set here.

### Targeting model (LOCKED, per official targeting docs)

- **Default (1x)**: country select/exclude, ASN exclude — offered freely.
- **Filters (2x)**: state, city, ZIP, ASN-include — require country first; checkout shows an explicit 2x surcharge line; `400 NO_RAY` (no IPs for filter) surfaces as retryable UX, never silent failure.
- **Premium pool**: all filters included at 1x.

### Targeting wire encoding (LOCKED — verified live against official parameter docs 2026-09-17)

Geo/session targeting is encoded as a **username suffix**, NOT as separate API fields:

```
http://<login>__<params>:<password>@gw.dataimpulse.com:<port>
<params> := key "." value ["," value] [";" key "." value ...]
```

- `__` separates login from params · `.` separates key from values · `,` separates multiple values · `;` separates params.
- Verified keys: `cr` (country, e.g. `__cr.de`, multi `__cr.de,au`), `city` (e.g. `__cr.de;city.berlin`, multi `__cr.es;city.madrid,barcelona`), `nocity` (exclusion, 2x), `state`, `zip` (e.g. `__cr.us;zip.10001`), `sessid` (30-min IP pin, e.g. `__cr.au;sessid.123`), `sessttl` (rotation interval, e.g. `__cr.fr;sessttl.60` on sticky port `10000`).
- Country is mandatory before city/state/ZIP/ASN params (upstream rejects otherwise — treat as client-validation rule, Zod-enforced).
- ASN-include/exclude username keys were NOT directly verified — implement `exclude_asn` via `set-default-pool-parameters` (verified) and confirm any username ASN key in sandbox before exposing it in UI. Never ship `00`'s old `__cr.us__city.phoenix` shape (double-`__` + `.` join) — it contradicts the live grammar above.
- The config generator (`01` §19, `04` §3.5) MUST build usernames through one shared `buildTargetingSuffix()` in the provider adapter — no ad-hoc string concat in components. Values are slug-validated (`^[a-z0-9-]+$`, length-capped) to block credential-injection via crafted city names.

### Common Locations

- **Endpoint**: `/reseller/common/locations?pool_type=`
- **Response**: `[{ country_code, country_name }]` — country-only (no city list exists upstream; do not build city dropdowns from this).

### Common Pool Stats (inventory)

- **Endpoint**: `/reseller/common/pool_stats?pool_type=`
- **Response**: `[{ country_code, country_name, count }]` — per-country availability; powers stock UI + hourly metadata sync (upsert, never full overwrite).

---

## 7. Proxy Security (IP Auth & Protocols)

### Allowed IPs Add / Remove

- **Endpoints**: `/reseller/sub-user/allowed-ips/add` & `.../remove` (`{ subuser_id, ip }`, max 5 per sub-user)
- **Critical constraint (live error: `"Bind is already exists for other subuser."`)**: one IP may be bound to exactly ONE sub-user globally. Multi-pool users must MOVE (not copy) an IP between proxy types — UI enforces move semantics with clear copy. Validate IPv4/IPv6 server-side, reject private/loopback.

### Supported Protocols Get / Set

- **Endpoints**: `GET /reseller/sub-user/supported-protocols/get?subuser_id=` → `{ supported_protocols: [http, socks5] }`; `POST .../set { subuser_id, supported_protocols }`
- Always get-before-set; config generator offers only the returned set.

---

## 8. Gateway & Connection Reference (LOCKED)

| Purpose | Endpoint |
|---|---|
| HTTP rotating | `http://login:password@gw.dataimpulse.com:823` |
| SOCKS5 rotating | `socks5://login:password@gw.dataimpulse.com:824` |
| Sticky (HTTP/SOCKS5) | `...@gw.dataimpulse.com:10000–20000` (port from `sticky_range`) |
| DNS host (preferred) | `gw.dataimpulse.com` (auto-closest) |
| IP fallback | `74.81.81.81` (changes possible — never primary) |

Default open destination ports: `80, 443, 5228, 53, 5060, 8080, 8090, 8443, 853, 8888`. SMTP/IMAP restricted (unblock via support + KYC). White-label custom DNS exists — DEFERRED; generator reads host/ports from server env so adoption needs no UI change.

---

## Summary

### Confirmed Supported (live)

- Token auth (JWT, exp-driven refresh) · reseller balance · sub-user CRUD + `list`/`get` · `reset-password` · `set-blocked` · `delete` (after drop) · `balance/add|drop|get|addition-history` (GB in / bytes out, coefficients) · `usage-stat/get|detail|errors` · IP whitelist (max 5, globally unique) · protocol get/set · country targeting + 2x state/city/ZIP/ASN filters (1x on premium) · `locations` + `pool_stats` · static gateways above.

### Not Supported / Does Not Exist

- City/state/ZIP **list** endpoint (params work, lists don't) · upstream cost API (manual costing) · upstream expiry timestamps (local enforcement) · published rate limits (own budget) · `set-blocked-hosts` for end users (admin-reserved).

### Pre-launch sandbox confirmations (only remaining unknowns)

1. `traffic: 1` → +1 GiB; fractional/zero handling; negative-subtract semantics.
2. Exact `pool_type` create strings (incl. premium) + `residental` typo tolerance.
3. Real token TTL + 401 behavior; 429 thresholds; delete balance fate; max sub-users/IPs global caps.
