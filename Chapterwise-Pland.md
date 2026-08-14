# AstroApp — Chapterwise Build Plan

> Status legend: 🔲 not started · 🟡 in progress · ✅ done
> Stack recap: Next.js (Client) + Fastify/Node/TS (Server) + Postgres via Docker + Drizzle ORM + swisseph (native, Lahiri ayanamsa) + Razorpay. Deploy target: Hostinger KVM 2, self-managed Docker.

---

## Chapter 1: Project Initialization ✅

**Goal:** A running skeleton — Client and Server boot, talk to each other, and are containerized, before any real feature work starts.

- 1.1 Confirm folder structure: `Client/` (Next.js), `Server/` (Fastify), root-level `docker-compose.yml`
- 1.2 Server: TypeScript config, ESLint + Prettier, path aliases, `.env` / `.env.example` convention
- 1.3 Server: base Fastify app — health check route (`GET /health`), request logging (pino, Fastify's default), CORS setup scoped to Client's origin
- 1.4 Client: Next.js app router setup, base layout, env var handling (`NEXT_PUBLIC_API_URL` etc.), fetch wrapper for hitting Server API
- 1.5 Shared types strategy: decide how Client/Server share TS types (e.g. a `packages/shared` workspace, or duplicate + keep in sync manually for now — recommend deferring monorepo tooling until it hurts)
- 1.6 Git hygiene: `.gitignore`, commit conventions, branch strategy (even if solo — keeps history clean for when you're not)
- 1.7 Local dev script: one command to boot Client + Server + DB together (npm workspaces script or simple shell script)

**Exit criteria:** `docker compose up` boots Postgres + Server; Server responds on `/health`; Client dev server hits Server and renders something.

---

## Chapter 2: Database, ORM & Docker Setup ✅

**Goal:** Postgres running in Docker (same setup locally and on the Hostinger box), Drizzle wired up, first migration applied.

- 2.1 `docker-compose.yml`: Postgres service with named volume, healthcheck, env-driven credentials
- 2.2 Server `Dockerfile`: multi-stage build, native build tools (`python3`, `make`, `g++`) included for `swisseph` compilation
- 2.3 Drizzle setup: `drizzle.config.ts`, connection module (`src/db/index.ts`) using `pg` pool
- 2.4 Initial schema — `users`, `birth_profiles` tables (as scaffolded earlier); decide now whether chat history / horoscopes get their own tables in this pass or later chapters
- 2.5 Migration workflow: `drizzle-kit generate` + `drizzle-kit migrate`, decide how migrations run in production (manual step vs entrypoint script on container start)
- 2.6 Seed script for local dev (a couple of fake users/profiles to test against without manual entry every time)
- 2.7 Backup strategy note for production Postgres (even a simple cron `pg_dump` to disk/off-box — self-hosted DB means this is 100% your responsibility)

**Exit criteria:** Fresh clone + `docker compose up` gets you a migrated, seeded local DB. Same compose file works on the KVM box with prod env vars.

---

## Chapter 3: Ephemeris Engine & Core Astrology Calculations 🔲

**Goal:** The deterministic math layer — the "source of truth" every other feature reads from. No LLM involved here at all.

- 3.1 `swisseph` integration, Lahiri ayanamsa (`SE_SIDM_LAHIRI`), Moshier mode (no external ephemeris files needed)
- 3.2 Timezone-correct UTC conversion: birth place lat/long → IANA timezone (`geo-tz`) → local wall time → UTC (`luxon`) → Julian Day. This is the step most naive builds get wrong — test it explicitly with known-offset cases (e.g. a birth during a DST transition window, if relevant to any target regions)
- 3.3 Planetary longitude calculation for Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Rahu (mean node), Ketu (derived, 180° from Rahu)
- 3.4 Ascendant (Lagna) calculation via `swe_houses_ex`, whole-sign house system
- 3.5 Rashi + degree-within-rashi mapping for every planet and the ascendant
- 3.6 Nakshatra + pada calculation (27 nakshatras × 4 padas — needed for matching in Chapter 6 and often expected in any Kundali display)
- 3.7 Retrograde detection (already covered by planet speed sign, confirm it's surfaced correctly for all planets)
- 3.8 Vimshottari Dasha calculation (mahadasha + antardasha at minimum; consider whether pratyantardasha is needed for v1 or deferred) — this feeds both the Kundali display and the chat agent's "current period" grounding
- 3.9 **Validation step:** cross-check output against 3-5 known reference charts (e.g. public figures' verified birth data, or output from an established tool like astro.com) before trusting this layer for anything downstream. Do not skip this — every feature after this chapter inherits any error here silently.

**Exit criteria:** Given birth date/time/place, the service returns planet positions, ascendant, rashi, nakshatra, and current dasha — verified against at least a few known-correct reference charts.

---

## Chapter 4: Kundali / Birth Chart Generation (Feature) 🔲

**Goal:** Turn Chapter 3's raw calculation engine into an actual user-facing feature — save, retrieve, and display a chart.

- 4.1 API: `POST /charts` — accepts birth details, runs Chapter 3 engine, persists result to `birth_profiles.chart_data`
- 4.2 API: `GET /charts/:id` — returns saved chart
- 4.3 Input validation (zod) — birth date bounds, valid lat/long, required fields; decide UX for unknown/approximate birth time (common real-world case — how does the app degrade gracefully? Ascendant/houses become unreliable without exact time, worth flagging to the user rather than silently computing garbage)
- 4.4 Place lookup: birth place → lat/long. Decide: a places autocomplete API (Google Places or similar) vs. a static city database for common Indian cities + a manual lat/long fallback. Static DB is cheaper and avoids a third-party dependency for v1
- 4.5 Client: birth details input form (date/time picker, place search)
- 4.6 Client: chart display — planet/rashi/nakshatra table at minimum for v1; a visual chart wheel (North/South Indian style) can be a fast-follow rather than a v1 blocker
- 4.7 Multiple profiles per user (needed for Chapter 6 matching — "Self" + saved profiles for family/partners)

**Exit criteria:** A logged-in user can enter birth details, get a saved Kundali, and view it again later.

---

## Chapter 5: User Auth & Profile Management 🔲

**Goal:** Know who's using the app, gate features by tier, support the multi-profile need from Chapter 4.

- 5.1 Decide auth method: phone OTP (most natural for an Indian consumer audience, but needs an SMS provider) vs. email/password vs. both
- 5.2 Session strategy: JWT vs. server-side sessions — pick based on whether you'll need to revoke sessions easily (self-hosted, so either is fine; JWT is simpler to start)
- 5.3 `users` table already scaffolded — extend as needed (avatar, preferred language field already present)
- 5.4 Client: auth flows (login/signup screens), protected routes
- 5.5 Server: auth middleware for protected routes, tier-gating middleware stub (used properly in Chapter 11)

**Exit criteria:** A user can sign up, log in, stay logged in across sessions, and their profiles/charts are tied to their account.

---

## Chapter 6: Love / Kundali Matching 🔲

**Goal:** Deterministic compatibility scoring between two charts — rule-based, not LLM-generated.

- 6.1 Ashtakoot (Guna Milan) scoring algorithm — the 8 kootas (Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, Nadi), each with defined point values, total out of 36
- 6.2 Mangal Dosh (Kuja Dosh) detection for both charts individually, and combined compatibility implication
- 6.3 API: `POST /match` — takes two profile IDs (or two raw birth detail sets), returns the full breakdown, not just a single number — users (and the LLM narrating it in Chapter 8) need the per-koota detail, not just "24/36"
- 6.4 Client: matching UI — input/select two profiles, display score breakdown clearly
- 6.5 Decide: does matching output get handed to the LLM for a narrated summary (recommended — raw guna scores mean little to most users) or shown as raw numbers only in v1

**Exit criteria:** Two saved profiles can be matched, producing a verified-correct Ashtakoot score and Mangal Dosh flag.

---

## Chapter 7: Daily Horoscope Engine 🔲

**Goal:** Automated, low-cost daily content per rashi — the retention hook.

- 7.1 Decide generation approach: (a) compute current transits for each of the 12 rashis and hand to LLM for narrative generation, run once daily via cron, cache result — cheapest and most scalable; (b) fully rule-based templated text — cheaper still but less engaging. Recommend (a), generated once per rashi per day (not per-user), since the astrology-relevant input is the same for everyone born under a given rashi
- 7.2 Scheduled job (node-cron or a system cron hitting an internal endpoint) — runs once daily, computes current planetary transits, generates + caches 12 horoscopes (EN/HI/Hinglish — decide if all 3 are generated daily or generated on-demand per user's language pref)
- 7.3 Table for cached horoscopes: `daily_horoscopes` (rashi, date, language, content)
- 7.4 API: `GET /horoscope/:rashi?lang=hi`
- 7.5 Client: horoscope display, likely on a home/dashboard screen, per user's own rashi (derived from their saved birth profile) shown prominently

**Exit criteria:** Every rashi has a fresh, cached horoscope generated daily without manual intervention, served fast (no LLM call in the request path).

---

## Chapter 8: Chat Agent — Tool Architecture & Grounding 🔲

**Goal:** The core differentiator. LLM chat that answers using real chart data via tool calls — never freelancing astrological claims.

- 8.1 Tool definitions the LLM can call: e.g. `getChart(profileId)`, `getCurrentDasha(profileId)`, `getTransits(date)`, `getMatchScore(profileIdA, profileIdB)` — design tool _return schemas_ to only expose the granularity your methodology actually supports (period/theme level, not day-level predictions — per our earlier discussion)
- 8.2 System prompt design: explicit instruction that every astrological claim must trace back to a tool result; no claim without backing data
- 8.3 Precision-mismatch handling: when a user asks for finer granularity than tools support (e.g. "what happens to me tomorrow"), the model reframes to the nearest supported granularity rather than inventing detail (the "trap query" pattern discussed earlier)
- 8.4 Conversation persistence: `chat_sessions` / `chat_messages` tables, tied to user + profile
- 8.5 Server: streaming response handling (SSE or similar) from LLM provider through Fastify to Client
- 8.6 Client: chat UI, message history, profile-context switcher (which saved profile is this conversation about)

**Exit criteria:** A user can ask chart-related questions and get answers that are traceably grounded in tool output, with no invented specifics.

---

## Chapter 9: Chat Agent — Guardrails & Language Handling 🔲

**Goal:** Make the agent safe, honest without being reckless, and fluent across English/Hindi/Hinglish.

- 9.1 "Doesn't sugarcoat but doesn't cause harm" policy encoded in system prompt: honest about unfavorable indications, paired with remedy/agency framing rather than blunt doom statements (per earlier discussion)
- 9.2 Sensitive-topic guardrails: explicit handling for health/death/marriage-breakdown/financial-ruin questions — disclaimers, redirect to professional advice where appropriate (this is not medical or financial advice, and should say so when relevant)
- 9.3 Trap-query eval set: a maintained test suite of over-precise queries ("what will happen to me today," "what time should I leave the house") — run before every prompt/model change to catch fabrication regressions
- 9.4 Language detection + response matching: user's input language/script drives response language; explicit handling for Hinglish (code-switched) input so the model doesn't awkwardly force pure Hindi or pure English
- 9.5 Terminology consistency: a small glossary (rashi, nakshatra, dasha, dosh, etc.) so the model uses consistent, correct terms across languages instead of ad-hoc transliteration
- 9.6 Basic input moderation (abuse, self-harm signals in chat — decide escalation behavior, e.g. surfacing crisis resources if needed) — separate from astrology-specific guardrails but necessary for any consumer chat surface

**Exit criteria:** Trap-query eval suite passes consistently; a native Hindi/Hinglish speaker has reviewed chat output for naturalness and terminology correctness.

---

## Chapter 10: Frontend Polish & Core UX 🔲

**Goal:** Tie Chapters 4–9's features into one coherent app experience.

- 10.1 App-level i18n setup (UI strings, not chat content) — EN/HI toggle at minimum, decide if UI itself needs Hinglish or just EN/HI with chat content handling Hinglish separately
- 10.2 Navigation/dashboard: home screen surfacing daily horoscope, saved profiles, quick access to chat and matching
- 10.3 Onboarding flow: first-time birth detail entry, clear messaging about why exact time/place matters
- 10.4 Responsive/mobile-first layout (assume most users are on mobile)
- 10.5 Loading/error states across all async operations (chart gen, chat streaming, matching)

**Exit criteria:** A new user can go from signup → birth details → Kundali → chat → matching without confusion, in either language.

---

## Chapter 11: Free/Pro Tiers & Razorpay 🔲

**Goal:** Monetization layer.

- 11.1 Define tier boundaries concretely: what's free (e.g. basic Kundali, daily horoscope, N chat messages/month) vs. Pro (unlimited chat, matching, deeper reports) — nail this down before building the gating logic
- 11.2 Razorpay integration: order creation, checkout flow, webhook handling for payment confirmation
- 11.3 Subscription vs. one-time credits model — decide which fits (subscription is more predictable revenue; credits may suit "pay per consultation" astrology-app norms better — worth deciding based on how AstroTalk-style competitors structure pricing)
- 11.4 `subscriptions` / `credits` table, tied to `users`
- 11.5 Tier-gating middleware (stubbed in Chapter 5) applied to actual routes (chat message limits, matching access, etc.)
- 11.6 Client: pricing page, upgrade flow, payment status handling (success/failure/pending webhooks can lag)
- 11.7 Invoicing/GST considerations for Indian payments (Razorpay handles a lot but confirm compliance basics for your business setup)

**Exit criteria:** A user can hit a free-tier limit, upgrade via Razorpay, and immediately get Pro access reflected correctly.

---

## Chapter 12: Testing & Accuracy Evals 🔲

**Goal:** Confidence the app is both technically correct and astrologically credible before real users touch it.

- 12.1 Unit tests for ephemeris/Kundali calculations (beyond the manual validation in Chapter 3 — automate the known-reference-chart checks so they run on every change)
- 12.2 Unit tests for Ashtakoot/Mangal Dosh scoring logic
- 12.3 Chat agent eval suite: trap queries (Chapter 9) + general quality checks (does it use tools correctly, does it cite the right dasha period, etc.)
- 12.4 API integration tests (auth, chart CRUD, payment webhook handling)
- 12.5 Load-check the LLM chat path specifically — streaming + concurrent users, since this is your most expensive and most latency-sensitive path

**Exit criteria:** CI runs calculation + scoring + eval suites automatically; no chart/matching regression can ship silently.

---

## Chapter 13: Deployment (Hostinger KVM 2) 🔲

**Goal:** Reliable production deployment on the self-managed VPS.

- 13.1 Server provisioning: Docker + Docker Compose installed on the KVM box, firewall rules (only expose what's needed — likely 80/443 via reverse proxy, not raw app ports)
- 13.2 Reverse proxy + TLS: Caddy or Nginx + Certbot for HTTPS on your domain
- 13.3 Production `docker-compose.yml` (extends/overrides the dev one — different env vars, no dev-only ports exposed)
- 13.4 Environment secrets management on the box (`.env` file permissions, or a secrets manager if you want to be stricter)
- 13.5 Deployment method: manual `git pull` + `docker compose up -d --build` is fine to start; consider a simple CI/CD (GitHub Actions → SSH deploy) once the manual flow gets tedious
- 13.6 Postgres backup automation on the box (cron `pg_dump` → off-box storage — don't rely on the VPS disk alone)
- 13.7 Basic monitoring/alerting: uptime check at minimum (even a free service pinging `/health`), server resource monitoring (KVM 2 has fixed RAM/CPU — watch for the LLM chat path or swisseph calc load causing pressure)
- 13.8 Logging strategy in production (where do Fastify/pino logs go — file + rotation, or shipped somewhere queryable)

**Exit criteria:** App is live on your domain, HTTPS working, survives a server reboot cleanly, backups are actually running (verify by restoring one, not just assuming the cron works).

---

## Suggested build order dependencies

```
Ch1 (Init) → Ch2 (DB/Docker) → Ch3 (Ephemeris engine)
                                      ↓
                          Ch4 (Kundali feature) ← Ch5 (Auth, can run parallel to Ch4)
                                      ↓
                    ┌─────────────────┼─────────────────┐
              Ch6 (Matching)   Ch7 (Horoscope)   Ch8 (Chat tools)
                    ↓                 ↓                 ↓
                    └─────────────────┴──── Ch9 (Guardrails/lang) ──┘
                                      ↓
                              Ch10 (Frontend polish)
                                      ↓
                              Ch11 (Tiers/Razorpay)
                                      ↓
                              Ch12 (Testing/evals) — actually ongoing from Ch3
                                      ↓
                              Ch13 (Deployment) — can be stood up as early as Ch2
```

Note: Ch13's basic Docker deployment is worth standing up early (right after Ch2) even in a minimal form — cheaper to catch environment-specific issues (like the native `swisseph` compile) on the real KVM box early than to discover them right before launch.
