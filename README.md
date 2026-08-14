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

## Database (Postgres via Docker)

Boot Postgres only (useful when running the server locally outside Docker, e.g. via `npm run dev`):

```bash
docker compose up postgres -d
```

Then, from `server/`, apply migrations and seed some local test data:

```bash
cd server
npm run db:migrate
npm run db:seed
```

Other useful commands (run from `server/`):
- `npm run db:generate` — after changing `src/db/schema.ts`, generates a new SQL migration file
- `npm run db:studio` — opens Drizzle Studio to browse the DB in a UI

To run **everything** (Postgres + Server) in Docker:

```bash
docker compose up --build
```

The server container's entrypoint runs migrations automatically before starting, so a fresh
`docker compose up` on a clean volume ends up migrated with no manual step.

## Running (app dev servers)

From the repo root, boot both dev servers at once:

```bash
npm run dev
```

- Server: `http://localhost:4000` (health check at `/health` — also reports DB connectivity)
- Client: `http://localhost:3000`

Or run either individually: `npm run dev:server` / `npm run dev:client`.

## Production notes

Postgres is self-hosted (no managed DB service) — backups are entirely our responsibility. A
`pg_dump` cron job shipping off-box is planned as part of Chapter 13 (deployment); don't consider
production data safe until that's actually running and a restore has been tested at least once.

## Conventions

- Commits: keep messages descriptive of intent (`feat: ...`, `fix: ...`, `chore: ...` prefixes
  encouraged, not enforced by tooling yet).
- Shared types between client/server: **not yet tooled** — duplicated by hand for now. Revisit
  (e.g. a `packages/shared` workspace) once the duplication actually causes pain, per Chapter 1 of
  the build plan.
