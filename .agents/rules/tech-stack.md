---
description: Enforces the strict, modern tech stack required for ProxyData.
trigger: always_on
---

# STRICT TECH STACK DIRECTIVE (PROXYDATA)

You are an expert full-stack developer working on the **ProxyData** platform. You MUST strictly adhere to the following technological constraints. If you deviate from these versions, the codebase will break.

## 1. Core Framework & UI

* **Next.js 16 (App Router only)**: `app/` directory. NEVER use `pages/`, `getServerSideProps`, or `getStaticProps`. Use React Server Components by default, `"use client"` only when needed (hooks, events, browser APIs).
* **React 19**: No legacy lifecycles, no `React.FC` without need. Use Server Actions where appropriate, not ad-hoc API routes for mutations.
* **TypeScript `strict: true`**: No `any` without justification. Validate all external input with `zod`.
* **Tailwind CSS v4 (CSS-first)**: Theme in CSS via `@theme` in `app/globals.css` (e.g. `@import "tailwindcss";`). **NEVER** create `tailwind.config.ts` / `tailwind.config.js`. No `@apply` for custom utilities unless v4-compatible.
* **HeroUI v3 (`@heroui/react`)**: NEVER use `@nextui-org/react`. NEVER wrap app in `NextUIProvider` (v2 pattern — v3 needs no provider). Use compound pattern: `Card.Header`, `Card.Content`, etc. Check HeroUI MCP docs before guessing props.
* **Client boundary rule**: EVERY file in `src/components/ui/*` MUST start with `"use client"` — HeroUI v3 is client-only, and importing a primitive from a Server Component fails the build (`client-only` error). Server pages may import ui/* freely once the primitives carry the directive.
* **Icons (`@gravity-ui/icons` ONLY)**: NEVER install `lucide-react` or other icon sets without an ADR (locked aesthetic match for HeroUI v3).
* **Route guard (`proxy.ts` ONLY)**: Next.js 16 guard lives in `proxy.ts`. NEVER create `src/middleware.ts` (legacy pattern).
* **Framer Motion (`motion` / `framer-motion`)**: All UI animations. Respect `prefers-reduced-motion`.

## 2. Progressive Web App (PWA)

* **PWA Engine: `@serwist/next` ONLY**. NEVER use `next-pwa` (deprecated, breaks Next 16).
* Service worker via Serwist config (`next.config.ts` wrapper). Test offline fallback + manifest + icons before marking PWA done.

## 3. Database & Backend

* **MongoDB Native Driver (`mongodb`) + `zod` ONLY**. NEVER use Mongoose.
* **Connection singleton**: One shared `MongoClient` (global cache in dev). MUST set `maxPoolSize: 10` to protect Free Tier.
* **Storage limit (512MB)**: NO binary uploads to MongoDB (no avatars/receipts as Buffer). Use external URLs or generated initials / SVG placeholders.
* **Auth (Better Auth ONLY)**: Cookie sessions (HTTP-only). NEVER install `jsonwebtoken` / `bcryptjs` / `jose` for app auth. No `src/lib/jwt.ts`, no custom password hashing. Suspend/deactivate revokes all Better Auth `sessions` rows + expires cookies (fail-closed).
* **Auth / Validation**: Validate every API route body/query with `zod`. Return proper status codes (`400` validation, `401`/`403` auth, `404` missing).
* **Data flow**: Reads via `swr` / React Query with TTLs (never per-render DB hits, never cache secrets). Writes via Server Actions with `zod` validation.
* **Admin routes**: ALL admin routes live under `ADMIN_PATH` server env (never literal `/admin`, never `NEXT_PUBLIC_`). Every admin route/action checks `user.role === 'ROLE_ADMIN'`.

## 4. MCP & Anti-Hallucination Protocol (MANDATORY)

Available MCP servers (see `opencode.json` / `.agents/mcp_config.json`):

* `context7` — live docs for Next.js 16, Tailwind v4, Serwist, Mongo driver. Use when unsure of syntax. Add `use context7` to intent.
* `heroui` — HeroUI v3 props, variants, examples. ALWAYS check before writing new HeroUI UI.
* `playwright` — headless browser. Use to visually verify UI changes (`npm run dev`, snapshot, screenshot, console check).
* `github` — DISABLED by default (high context cost). Enable per-task only to read premium OSS design systems. Requires `GITHUB_PERSONAL_ACCESS_TOKEN` env var — NEVER hardcode tokens.

RULE: If unsure of modern syntax for Next.js 16 / Tailwind v4 / HeroUI v3 / Serwist, **DO NOT GUESS**. Query Context7/HeroUI MCP first, then write code.

## 5. Hosting (Hostinger — persistent Node, NOT serverless)

* PM2 persistent Node.js process. NEVER write Vercel edge functions.
* `next.config.ts` MUST set `output: 'standalone'`. Standard `npm run build` / `npm start`.
* Ephemeral filesystem between deploys: NEVER persist uploads/caches to disk. MongoDB for everything.

## 6. Verification Before Done

After any UI or API change:

1. `npx tsc --noEmit`
2. `npm run build` (must pass for Next 16)
3. `npm run dev` + Playwright: snapshot, screenshot, no console errors
4. Confirm no forbidden imports: `next-pwa`, `mongoose`, `@nextui-org/react`, `lucide-react`, `jsonwebtoken`, `bcryptjs`, `tailwind.config.*`, `src/middleware.ts`
