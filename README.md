# AstroApp

AI-powered Vedic astrology app — Kundali generation, chart matching, daily horoscopes, and a
tool-grounded chat agent. See `Chapterwise-Pland.md` for the full build plan.

## Stack

- **client/** — Next.js (App Router), shadcn/ui, TanStack Query. Package manager: **bun**.
- **server/** — Fastify + TypeScript, zod-validated env, Drizzle ORM (added in Chapter 2). Package
  manager: **npm**.
- **Postgres** via Docker (added in Chapter 2).

Two different package managers are used intentionally (`bun` for client, `npm` for server) — this
is why the repo isn't set up as a single npm/bun workspace.

## Local setup

1. **Server**
   ```bash
   cd server
   cp .env.example .env
   npm install
   ```

2. **Client**
   ```bash
   cd client
   cp .env.example .env.local
   bun install
   ```

3. **Root tooling** (for running both together)
   ```bash
   npm install
   ```

## Running

From the repo root, boot both dev servers at once:

```bash
npm run dev
```

- Server: `http://localhost:4000` (health check at `/health`)
- Client: `http://localhost:3000`

Or run either individually: `npm run dev:server` / `npm run dev:client`.

> Postgres isn't wired in yet — that's Chapter 2. Right now `npm run dev` is enough to verify the
> Client can reach the Server (the home page shows a live server-connection status).

## Conventions

- Commits: keep messages descriptive of intent (`feat: ...`, `fix: ...`, `chore: ...` prefixes
  encouraged, not enforced by tooling yet).
- Shared types between client/server: **not yet tooled** — duplicated by hand for now. Revisit
  (e.g. a `packages/shared` workspace) once the duplication actually causes pain, per Chapter 1 of
  the build plan.
