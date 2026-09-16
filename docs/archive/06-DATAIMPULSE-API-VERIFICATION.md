# DataImpulse API — Live Verification (Postman Collection + Official Docs)

> **Status**: EVIDENCE + DISPOSITIONED — findings checked 2026-09-16, all §4 delta items folded into `01–04` v1.1.0 on 2026-09-17. Preserved as the verification trail; build from `01`/`02`/`03`/`04`.

> **Source of truth checked live on 2026-09-16**
> - Postman collection: `https://documenter.getpostman.com/view/6095389/2s9YC7UC2x`
>   collectionId `6095389-565b6596-03a5-4ccc-a3dd-102bfe03692a`, 24 endpoints extracted via
>   `https://documenter.gw.postman.com/api/collections/6095389/2s9YC7UC2x?segregateAuth=true&versionTag=latest`
> - Official docs: `https://docs.dataimpulse.com/resellers`, `/resellers/deposit-calculation-update`,
>   `/resellers/target-filters-for-sub-users`, `/proxies/connection-hosts`, `/proxies/protocols`,
>   `/proxies/targeting`, `/authentication-methods/whitelist-ips`, `/resellers/custom-dns-host`
> - Local doc under test: `docs/02-DATAIMPULSE-API-AUDIT.md` (243 lines)

---

## 1. Complete live endpoint inventory (24) vs local audit coverage

| # | Method + Path | In local `02` audit? | Verdict |
|---|---------------|----------------------|---------|
| 1 | `POST /reseller/user/token/get` (formdata `login`,`password`) | YES | OK, but expiry wrong — see §3.1 |
| 2 | `GET /reseller/user/balance` → `{balance: 105}` | YES | OK |
| 3 | `POST /reseller/sub-user/allowed-ips/add` `{subuser_id, ip}` | YES | PARTIAL — misses global-uniqueness error, see §3.7 |
| 4 | `POST /reseller/sub-user/allowed-ips/remove` | YES | OK |
| 5 | `GET /reseller/sub-user/balance/get?subuser_id=` → `{balance, balance_format, balance_total, balance_total_format, balance_used, threads_used}` | YES | OK + NEW fields `balance_total/used`, `threads_used` not mapped to DB |
| 6 | `POST /reseller/sub-user/balance/add` `{subuser_id, traffic}` | YES | PARTIAL — unit now resolvable (§3.2), negative-traffic subtract undocumented (§3.3) |
| 7 | `POST /reseller/sub-user/balance/drop` `{subuser_id}` | YES | PARTIAL — delete-vs-drop order unspecced (§3.4) |
| 8 | `GET /reseller/sub-user/balance/addition-history?subuser_id=` → `{history:[{balance_charged, traffic_added, datetime}]}` | YES | PARTIAL — new `balance_charged` vs `traffic_added` split proves coefficient billing, unmapped (§3.5) |
| 9 | `GET /reseller/sub-user/usage-stat/get?subuser_id=&period=week|month|3months|6months` | YES | OK |
| 10 | `GET /reseller/sub-user/usage-stat/detail?subuser_id=&period=&limit=&offset=` | **NO — MISSING** | Returns per-request `{host, datetime, requests, traffic, status, message}`. Privacy impact (§3.8) |
| 11 | `GET /reseller/sub-user/usage-stat/errors?subuser_id=&period=&limit=&offset=` | **NO — MISSING** | Returns `{datetime, error, host, port, count}` e.g. `HOST_BLOCKED m.stripe.com:443 x2547`. Abuse/support use + privacy |
| 12 | `GET /reseller/sub-user/supported-protocols/get?subuser_id=` | **NO — MISSING** | Audit only documents `set`. Need get-before-set |
| 13 | `POST /reseller/sub-user/supported-protocols/set` `{subuser_id, supported_protocols:[http]\|...}` | YES | OK |
| 14 | `GET /reseller/sub-user/list` → full array incl. **plaintext `login`+`password`** per sub-user | **NO — MISSING** | Critical: cheapest reconciliation path + biggest secret-sprawl risk (§3.9) |
| 15 | `POST /reseller/sub-user/create` `{label, threads, sticky_range:{start,end}}` | YES | PARTIAL — live example has **NO `pool_type`** in request, yet response has `pool_type:"residental"` [sic]. Audit claims `pool_type` required + immutable. Contradiction (§3.6) |
| 16 | `POST /reseller/sub-user/update` `{subuser_id, threads,...}` | YES | OK |
| 17 | `POST /reseller/sub-user/reset-password` `{subuser_id}` → new `password` | **NO — MISSING** | Credential rotation never specced. Needed on leak/suspend (§3.9) |
| 18 | `POST /reseller/sub-user/set-blocked` `{subuser_id, blocked}` | YES | OK |
| 19 | `POST /reseller/sub-user/set-blocked-hosts` `{subuser_id, blocked_hosts:[...]}` | **NO — MISSING** | Per-user domain blacklist. Feature or abuse vector — decide |
| 20 | `GET /reseller/sub-user/get?subuser_id=` | YES | OK |
| 21 | `POST /reseller/sub-user/delete` `{subuser_id}` → `{success:true}` | **NO — MISSING** | Answers PRD open Q #1: delete EXISTS. Balance fate on delete unknown — must `drop` first (§3.4) |
| 22 | `POST /reseller/sub-user/set-default-pool-parameters` `{subuser_id, default_pool_parameters:{countries, exclude_asn, anonymous_filter, rotation_interval}}` | YES | PARTIAL — live schema adds `anonymous_filter`, `rotation_interval`; NO city/state/zip/asn-include here, yet proxy docs say they exist as connection params (§3.10) |
| 23 | `GET /reseller/common/locations?pool_type=` → `[{country_code, country_name}]` | YES | OK — confirms country-only list |
| 24 | `GET /reseller/common/pool_stats?pool_type=` → `[{country_code, country_name, count}]` | **NO — MISSING** | Live inventory counts per country. Use for availability UI instead of N+1 balance fanout |

9 endpoints entirely missing from local audit: `usage-stat/detail`, `usage-stat/errors`, `supported-protocols/get`, `sub-user/list`, `reset-password`, `set-blocked-hosts`, `delete`, `common/pool_stats` (+ `set-blocked-hosts`).

---

## 2. Gateway / protocol answers (resolves PRD TODOs)

From `/proxies/connection-hosts` + `/proxies/protocols` (live):

- DNS host: `gw.dataimpulse.com` (recommended, auto-closest). IP fallback: `74.81.81.81` (can change — do NOT hardcode IP).
- `http://login:password@gw.dataimpulse.com:823` — HTTP rotating
- `socks5://login:password@gw.dataimpulse.com:824` — SOCKS5 rotating
- `http|socks5://login:password@gw.dataimpulse.com:10000–20000` — sticky (port = session range)
- HTTPS supported via HTTP port. UID: sticky_range `{start:11000,end:20000}` in `create/list` responses maps to this.
- Default destination ports open: `80,443,5228,53,5060,8080,8090,8443,853,8888`. SMTP/IMAP restricted; unblock via `support@dataimpulse.com` + KYC.
- White-label: `/resellers/custom-dns-host` — resellers can hide `gw.dataimpulse.com` behind own domain. Local plan never mentions this; decide if ProxyData uses DataImpulse host directly or branded host (affects PWA config generator + docs).

Action: replace `DATAIMPULSE_GATEWAY_HOST/PORT` TODO (`01:880`, `03:549`) with table above + `STICKY_PORT_RANGE` + `CUSTOM_DNS_HOST` (optional). Health check should assert DNS resolves + ports reachable.

---

## 3. Findings that change the plan

### 3.1 Token expiry: “24h” is wrong per live example
Audit `02:23` says 24h cache/refresh. Live `token/get` example JWT: `iat 1694765803 → exp 1725869803` ≈ **~365 days**, not 24h. Either docs drifted or expiry varies. Do NOT hardcode 24h refresh; implement: persist `exp` from JWT, refresh at `min(exp-1h, 20h)`, backoff on 401 at call time (re-auth once + retry once). Multi-instance needs single-flight refresh.

### 3.2 Traffic unit: GB (int) in, bytes out — nearly resolved
- `balance/add` example: `{subuser_id:4050, traffic:2}` → `{success:true}`.
- `addition-history` example: `{balance_charged:1, traffic_added:1}`, `{2,2}` — 1:1 in examples.
- `balance/get` example: `{balance:12900079458, balance_format:"12.01 GB", balance_total:214748364800,...}` — balances are **bytes**.
- Deposit doc: “Request 10 GB → Deduction 10 GB (residential)” — request unit is **GB**.
- Conclusion: `traffic` = **GB integer** (not bytes). Still must live-test: send `traffic:1` to throwaway sub-user, assert `balance_total` += 1073741824 and `history.traffic_added==1`, then `drop`. Also test fractional (1.5?) and 0/negative — spec must state integer-only if API rejects floats. Until then keep `PENDING_VERIFICATION` but default adapter to GB with `BYTES_PER_GB=1073741824`.

### 3.3 Negative `traffic` subtracts — undocumented path
Reseller blog (live): “to subtract traffic, use minus sign before traffic amount” — i.e. `balance/add {traffic:-N}`. Local audit/DB never mention this; they only allow `drop` (full clear). Decide: allow partial clawback via negative add (for expiry/plan-downgrade) or forbid and use `drop` only. If allowed, guard: never let `traffic` go negative server-side without admin audit + `provider_operation_logs`.

### 3.4 `delete` exists — but drop-first order mandatory
`sub-user/delete {subuser_id}` → `{success:true}` answers `01:892` Q1. Unknown: does delete forfeit remaining balance or auto-refund to reseller pool? Safest: `drop` → verify `balance==0` → `delete`, all logged. Spec suspension (block, keep data) vs deactivation (drop+delete) vs plan-expiry (block+optional drop) as three distinct flows — currently conflated.

### 3.5 `balance_charged ≠ traffic_added` — coefficient billing
`addition-history` returns BOTH fields. Combined with deposit doc coefficients — Residential x1, Datacenter x0.5, Mobile x2, Premium Residential x5 — a 10 GB mobile allocation charges 20 GB reseller balance. Local margin ledger (`01:410-416`, `03:319-335`) assumes 1:1 cost. **All profit/commission math is wrong until `costBasis = requestedGb × poolCoefficient × costPerGb` lands in `transactions.providerCostBdt`.** Also store both `traffic_added` + `balance_charged` per allocation for reconciliation.

### 3.6 `pool_type` create contradiction + typo + 4th pool
- Audit `02:49` says `pool_type ∈ {datacenter,residential,mobile}` required, immutable.
- Live `create` example body has NO `pool_type`; live `set-blocked-hosts` response has `"pool_type":"residental"` (misspelled, single-s).
- Deposit + premium pages prove **4th pool: Premium Residential (x5, $5/GB, targeting included)**. Audit §Summary explicitly says premium “not documented” — now falsified.
- Actions: live-test `create` with/without `pool_type` (incl. `premium_residential`? `residential_premium`? exact string), record actual enum + typo behavior, add 4th `proxyType` or explicitly defer with reason. `IProxyProvider` (`01:369-404`) must accept `poolType` on create, not just `internalUserId`.

### 3.7 IP whitelist global uniqueness breaks multi-type users
Live error on `allowed-ips/add`: `"Bind is already exists for other subuser."` + whitelist docs: “same IP cannot be added to multiple plans at the same time.” A user holding Residential + Mobile **cannot whitelist the same home IP on both** — core UX flaw for the flagship multi-plan story (`01:719`). Spec: one global IP-slot manager per user, clear error copy, UI that moves (not copies) an IP between proxy types. Max-5 limit is per-sub-user; global cap across sub-users unknown — test.

### 3.8 `usage-stat/detail|errors` = per-host browsing logs — privacy + value
`detail` returns `{host, datetime, requests, traffic, status}`; `errors` returns `{host, port, error, count}` (e.g. `HOST_BLOCKED m.stripe.com`). Useful for support (“why is X failing”) but exposes browsing destinations to anyone with admin/read access. Spec: user sees ONLY own hosts; admin sees aggregates unless explicit support-consent flag; retention/TTL for detail rows (do NOT store indefinitely like `transactions`).

### 3.9 `sub-user/list` leaks all passwords + `reset-password` missing from plan
`list` returns every sub-user with plaintext `password`. Never log/cache it client-side; server-only, redacted audit. Add `reset-password` flow: rotate on (a) user request, (b) suspected leak, (c) admin suspend/restore — and re-encrypt into `proxy_accounts.password` + invalidate old config strings. Currently no rotation story.

### 3.10 City/state/ZIP/ASN: supported as connection params, NOT as list API
Audit `02:183,229` “city unsupported” is half-wrong. Proxy docs (`/proxies/targeting`, `/resellers/target-filters-for-sub-users`): country/state/city/ASN/ZIP all supported; state/city/ASN/ZIP require country first; **billed 2x** (except premium pool, included). `locations`/`pool_stats` list countries (+counts) only; `set-default-pool-parameters` example only sets `countries/exclude_asn/anonymous_filter/rotation_interval`. So: city works at request time, but no city-list endpoint to populate dropdowns. Plan must EITHER (a) offer country + exclude-ASN only (1x cost, simple), OR (b) offer full filters with **2x surcharge passed to pricing/commission** + `400 NO_RAY` fallback copy when no IPs for that filter. Also add `threads`, `sticky_range`, `rotation_interval`, `anonymous_filter` to config generator — all live fields, none specced.

### 3.11 Never-expire traffic kills validityDays — enforce locally
Reseller program page (live): “Traffic doesn’t expire / Credit never expires.” So DataImpulse-side expiry does NOT exist — `01:893` Q2 answered: ProxyData must enforce `validityDays` itself via cron (`set-blocked` + optional `drop`/negative-add). Remove `PENDING_API_AUDIT` on expiry; spec clawback policy (forfeit vs refund) before advertising expiry in UI (`01:429`).

---

## 4. Delta checklist — what to patch in local docs

- `02`: add 9 missing endpoints (§1 rows 10–12,14,17,19,21,24) with method/path/body/response; correct token-expiry; document negative-traffic; document `balance_charged` + coefficients; correct premium + city sections; add gateway table (§2); document `threads_used`, `balance_total/used`, `sticky_range`, `anonymous_filter`, `rotation_interval`, `blocked_hosts`, `pool_type` typo.
- `01`: add 4th pool decision; pool-coefficient cost formula; 2x target-filter surcharge decision; drop-before-delete + 3 deprovision flows; price-lock point; TrxID dedupe; validityDays enforcement; custom-DNS decision; `IProxyProvider` signature fix (`createSubUser(poolType,...)`).
- `03`: store `traffic_added` + `balance_charged` per transaction; `proxy_accounts` needs `poolTypeRaw`, `threads`, `sticky_range`, `rotation_interval`, `anonymous_filter`, `blocked_hosts`; indexes for new idempotency/attribution; retention for `usage detail` (short) vs ledger (indefinite).
- `04`: gateway ports in config output; sticky vs rotating toggle (port 823/824 vs 10000+); IP-move (not copy) UX; `NO_RAY` error state; 2x-filter price warning; support view for `errors` endpoint.

## 5. Suggested live-test script (sandbox, throwaway sub-user)

1. `token/get` → decode JWT `exp`, record real TTL.
2. `create {label:tmp}` with NO pool_type → record default pool; retry with `residential|mobile|datacenter|premium_*` variants → record accepted enum.
3. `balance/add {traffic:1}` → `balance/get` (expect +1 GiB in `balance_total`) → `addition-history` (record `traffic_added` vs `balance_charged` per pool).
4. `balance/add {traffic:-1}` → confirm partial subtract works.
5. `allowed-ips/add` same IP on 2 sub-users → confirm global-uniqueness error.
6. `set-blocked true→false`, `reset-password`, `supported-protocols/get→set→get`.
7. `locations` + `pool_stats` per pool_type → confirm country-only + counts.
8. `set-default-pool-parameters {countries:[us]}` then city/state param at proxy-connect time → confirm 2x billing in history.
9. `drop` → `balance/get==0` → `delete` → `get` (expect 404) → `list` (absent).
