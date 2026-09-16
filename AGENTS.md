# ProxyData — Agent Rules

This is a Next.js 16 (App Router) + Tailwind v4 + HeroUI v3 + `@serwist/next` + MongoDB Native Driver project.

## Mandatory stack rules

Full enforceable spec: `.agents/rules/tech-stack.md` (also auto-loaded via `opencode.json` `instructions`).
Anigravity loads it via `trigger: always_on`. Opencode loads it via this file + `instructions`.

Do NOT deviate:

- App Router only, React 19, TypeScript strict, `zod` for all external input
- Tailwind v4 CSS-first (`app/globals.css` + `@theme`). NEVER create `tailwind.config.*`
- HeroUI v3 `@heroui/react` only. No `@nextui-org/react`, no `NextUIProvider`
- PWA: `@serwist/next` only. NEVER `next-pwa`
- MongoDB native `mongodb` driver only, `maxPoolSize: 10`, singleton client. NEVER Mongoose. No binary uploads (512MB limit)

## MCP usage

- Unsure of Next.js 16 / Tailwind v4 / Serwist syntax? Use `context7` tools first — do not guess. (`use context7`)
- New HeroUI UI? Check `heroui` MCP docs first for props/variants.
- After UI changes: `npm run dev` + `playwright` snapshot/screenshot + console check.
- `github` MCP is disabled by default (context cost). Enable per-task only. Requires `GITHUB_PERSONAL_ACCESS_TOKEN` env var — NEVER hardcode tokens. Same for `CONTEXT7_API_KEY`.

## Verify before done

1. `npx tsc --noEmit`
2. `npm run build`
3. No forbidden imports: `next-pwa`, `mongoose`, `@nextui-org/react`, `tailwind.config.*`

## Env setup (local only, never commit)

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_..."
export CONTEXT7_API_KEY="..."
```

If you leaked a token into `.agents/mcp_config.json` or git history, revoke it on github.com immediately and rewrite history.
