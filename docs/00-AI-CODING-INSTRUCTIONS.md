# STRICT AI CODING INSTRUCTIONS
**CRITICAL**: Every AI agent working on this codebase MUST read and strictly adhere to these instructions to prevent hallucinations, broken code, and deployment failures.

## 1. TECH STACK (STRICT VERSIONS — mirrors `01` §5; this file adds hosting deltas only, never overrides)
- **Framework**: Next.js 16 (App Router ONLY. Do not use Pages router).
- **Language**: TypeScript (Strict mode enabled).
- **Styling**: Tailwind CSS **v4** (Do not use v3 syntax or deprecated plugins; no `tailwind.config.ts` — CSS-first `@theme`).
- **UI Components**: HeroUI **v3** (Previously NextUI. Use `@heroui/react`, NOT `@nextui-org/react`. NO Provider wrapper — v3 works without it).
- **Animations**: Framer Motion (allowed in addition to the §01 stack; keep usage light — modal/drawer transitions only until a bundle budget is set).
- **Icons**: `@gravity-ui/icons` (locked aesthetic match for HeroUI v3 — do NOT introduce Lucide or other sets without an ADR).
- **Database**: MongoDB **Native Driver + Zod** (LOCKED per `01` §5 and `02` §2 — do NOT use Mongoose; `maxPoolSize: 10` still applies, see §3).
- **Validation**: Zod (shared client/server schemas; `react-hook-form` only for excessively dynamic forms).

## 2. HOSTING & DEPLOYMENT CONSTRAINTS (HOSTINGER)
- **Environment**: The app will be deployed on **Hostinger's "Deploy Web App" (Node.js/PM2)**. 
- **Not Serverless**: This is a persistent Node.js process, NOT Vercel serverless. Do not write Vercel-specific edge functions.
- **File System**: The file system is ephemeral between deployments. Do not write local files (e.g., SQLite, JSON caches, image uploads) expecting them to persist. Use MongoDB for everything.
- **Uploads decision (LOCKED)**: there is no object storage and Mongo is capped at 512 MB (§3), so (a) avatars = OAuth `image` or generated initials ONLY — no file upload endpoint in v1 (`04` §3.1 upload spec is SUSPENDED until a storage backend exists); (b) payout receipts = external free image host URL stored in `receiptUrl`, with image-URL allowlist validation, NOT binary in Mongo. Never persist binaries in any collection.

## 3. DATABASE CONSTRAINTS (MONGODB FREE TIER)
- **Connection Limit**: Free tier allows max 500 connections.
- **Guardrail**: The Native-driver client MUST enforce `maxPoolSize: 10` (single shared client, global-cached across hot reloads).
- **Operations Limit**: Free tier allows ~100 ops/sec. Do not query the DB on every single render. Implement server-side memory caching for static configs.
- **PM2 note**: memory caches are per-process. Single-instance PM2 is assumed; if cluster mode is ever enabled, treat memory cache as best-effort read-through (hourly metadata tolerates skew) and keep DataImpulse-token single-flight per-process with 401 re-auth as the convergence mechanism — never coordinate via the database.
- **Storage Limit**: 512 MB. Do not store heavy blobs (see uploads decision in §2).

## 4. API & BUSINESS LOGIC RULES
- **DataImpulse API**: Use the rules defined in `03-DATAIMPULSE-API.md`. Targeting suffixes MUST use the canonical grammar in `03` §6 (`<login>__key.v1,v2;key.v` — e.g. `login__cr.de;city.berlin`). Never invent `__`-joined shapes.
- **Doc precedence (LOCKED)**: on any conflict, `01` (requirements) + `02` (schema) + `03` (provider contract) + `04` (UI) override this file and `05-MASTER-WORKPLAN.md`. This file's authority is hosting deltas + anti-hallucination protocol only.
- **Email Limitations**: Hostinger SMTP restricts to 100 emails/day. Outbound mail is limited to the `01` §32 allowlist (password resets + 2 tiny admin system mails ≈ 3/day worst case). All receipts, approvals, rejections, and payouts use the In-App Notification schema + Toasts. Never add a new email hook without removing quota elsewhere.

## 5. ANTI-HALLUCINATION PROTOCOL
1. **Never guess API endpoints**. If you don't know the exact DataImpulse route, read `03-DATAIMPULSE-API.md`.
2. **Never invent NPM packages**. Stick to the approved stack.
3. **Never write generic "TODO" comments**. If a function is needed, write the actual implementation.
4. **Before coding a new page**, cross-reference `04-UI-PLAN.md` and `05-MASTER-WORKPLAN.md` to ensure you aren't deviating from the approved design.

## 6. MOBILE-FIRST & "NO REFRESH" ARCHITECTURE
- **Mobile-First UI**: Over 80% of users are on mobile. All Tailwind styling MUST be written mobile-first. Tables must have horizontal scroll (`overflow-x-auto`), grids must stack on mobile (`grid-cols-1 md:grid-cols-2`), and navigation must use mobile-friendly touch targets.
- **Single Page App (SPA) Feel**: Users must never experience a full page reload when changing configurations or navigating the dashboard.
- **State Management**: Use React Client Components (`"use client"`) and React State (`useState`, `useMemo`) for instantaneous UI updates (e.g., selecting a Country updates the preview instantly). Server Actions remain the mutation path (`04` Phase 5) — client state holds DISPLAY PARTS ONLY (endpoint, masked credentials, targeting labels). The full proxy string (with secret) is composed server-side via the adapter's `buildTargetingSuffix()` and returned on explicit user action (Generate/Copy); never assemble secrets from client-held parts and never persist them in `swr`/query caches beyond the session view.
- **Data Fetching**: Use `swr` or React Query for background READS (dashboard balance snapshots, metadata, history) with the TTLs in `01`/`02`; all WRITES go through Server Actions with Zod validation. Do not cache secrets, passwords, or full proxy strings in persistent query caches.
