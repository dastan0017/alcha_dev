# alcha.dev

Personal portfolio & web-development services site of **Dastan Rakhmanzhanov** — Senior
Frontend Engineer (Bishkek, Kyrgyzstan). A single monorepo containing the public website,
a content CRM, and the REST API that powers both.

> Business goal: rank first in Bishkek for website / web-app development. SEO is a
> first-class requirement — every public page is statically generated, fully localized
> (RU default at root, EN under `/en`), and updates within seconds of a CRM publish via
> on-demand ISR revalidation.

## Monorepo layout

```
alcha-dev/
  apps/
    web/    Next.js 15 (App Router) — public website (SSG + ISR)   :3000
    crm/    React 19 + Vite + Ant Design — content admin           :5173
    api/    NestJS 11 + Prisma + PostgreSQL — REST API             :4000
  packages/
    shared/ Shared TS types + zod DTO schemas + typed API client + design tokens
  docker-compose.yml   postgres:16 (+ optional minio for local S3)
  .env.example         every env var documented
```

Tooling: **pnpm workspaces + Turborepo**, Node 22, TypeScript strict everywhere, REST
(not GraphQL) so Next.js ISR fetch/caching stays simple.

## Content pipeline (the core idea)

```
edit in CRM ──▶ Save (draft in Postgres)
            └─▶ Publish ──▶ API marks published ──▶ POST WEB_URL/api/revalidate
                                                    (REVALIDATE_SECRET + cache tags)
                                                    └─▶ revalidateTag(...) ──▶ static page
                                                        refreshed in seconds, no rebuild
```

Cache tags: `content:home`, `content:about`, `content:settings`, `content:projects`,
`project:{slug}`. A time-based `revalidate = 3600` is the safety net.

## Prerequisites

- Node **22** (`nvm use` picks it up from `.nvmrc`) — the repo also runs on Node 20.9+.
- pnpm **9** (`corepack enable && corepack prepare pnpm@9.15.4 --activate`)
- Docker (Postgres, optional MinIO)

## Quick start

```bash
pnpm i
cp .env.example .env                 # fill in secrets (or keep dev defaults)
docker compose up -d postgres        # (or `pnpm db:up`)
pnpm db:migrate                      # apply Prisma migrations
pnpm db:seed                         # load ALL RU + EN content + admin user
pnpm dev                             # web :3000 · crm :5173 · api :4000
```

Then:

- Public site (RU): http://localhost:3000 — EN at http://localhost:3000/en
- CRM: http://localhost:5173 — log in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
- API docs (dev only): http://localhost:4000/docs

To use local S3 (MinIO) for media uploads: `pnpm db:up:all` (starts postgres + minio),
console at http://localhost:9001.

## Root scripts

| Script                | Does                                                        |
| --------------------- | ----------------------------------------------------------- |
| `pnpm dev`            | Boots Postgres, then all three apps in parallel (Turbo)     |
| `pnpm build`          | Builds shared → api → web → crm                             |
| `pnpm lint`           | ESLint across the workspace                                 |
| `pnpm typecheck`      | `tsc --noEmit` across the workspace                         |
| `pnpm test`           | Unit + e2e (API) + smoke (web)                              |
| `pnpm db:migrate`     | `prisma migrate dev` (create/apply migrations)              |
| `pnpm db:seed`        | Seed database with the full copy deck                       |
| `pnpm db:studio`      | Prisma Studio                                               |
| `pnpm format`         | Prettier write                                              |

## Environment variables

See [.env.example](.env.example) — every variable is documented there. The important ones:

- `DATABASE_URL` — Postgres connection (Prisma)
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — auth signing keys
- `REVALIDATE_SECRET` — shared secret between API and web `/api/revalidate`
- `WEB_URL`, `API_URL` — cross-service URLs
- `S3_*` — media storage (MinIO locally, S3/CloudFront in prod)
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — optional new-lead notifications
- `NEXT_PUBLIC_*` — analytics + search-console verification (off when empty)
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` — seeded admin login

## Deployment

| Service | Domain             | Notes                                                        |
| ------- | ------------------ | ----------------------------------------------------------- |
| web     | `alcha.dev`        | Next.js Node server (or Vercel). Needs `REVALIDATE_SECRET`. |
| api     | `api.alcha.dev`    | Docker + Postgres on a VPS. Runs migrations on deploy.      |
| crm     | `admin.alcha.dev`  | Static Vite build behind nginx (`VITE_API_URL` → api).      |

- CORS on the API is locked to the web + crm origins (`CORS_ORIGINS`).
- Swagger (`/docs`) and Prisma Studio are dev-only.
- CI (`.github/workflows/ci.yml`) runs lint + typecheck + build + test on every PR.

## Architecture notes

Same stack philosophy as the Kit Store and Chaban apps: NestJS + Prisma + PostgreSQL
backend, React admin, strict TypeScript, Docker, GitHub Actions-ready. Data uses the
**translation-table pattern** — a base row plus `*Translation` rows keyed by `locale`
(`ru` | `en`) — so every piece of content exists in both languages and is edited
side-by-side in the CRM.

See each app's own `README`-level comments and the [packages/shared](packages/shared)
contract for the DTO shapes exchanged between all three apps.
