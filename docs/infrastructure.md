# Production Infrastructure

Current production layout for Every Country Is Unique: Next.js on Vercel, NestJS API and PostgreSQL on Railway.

## Overview

```text
Browser
  → https://everycountryisunique.com / https://www.everycountryisunique.com  (Vercel, Next.js)
  → https://api.everycountryisunique.com                                 (Railway, NestJS)
  → Railway Postgres (private network)
```

- The frontend calls the API using `NEXT_PUBLIC_API_URL=https://api.everycountryisunique.com`.
- Geogrid puzzle/country import hits the API with header `X-API-Key` (same secret as Railway `API_KEY`).
- DNS is hosted at TransIP. Record values live in [dns.md](dns.md).

## Providers and projects

| Layer | Provider / plan | Project / service | Notes |
|-------|-----------------|-------------------|--------|
| Frontend | Vercel Hobby | `physicalattractions-projects/frontend` | App root is `frontend/` |
| API | Railway Hobby | Project `every-country-is-unique`, service `api` | Workspace **My Projects** |
| Database | Railway Hobby | Service `Postgres` (private network) | Referenced by API `DB_*` vars |

Railway CLI conventions for this repo (workspace, project IDs, SSH key): see `.cursor/rules/railway-cli.mdc`.

## Build and deploy

### API (Railway)

| Setting | Value |
|---------|--------|
| Source repo | `physicalattraction/every-country-is-unique` |
| Root directory | `/backend` |
| Builder | Railpack |
| Build command | `npm ci && npm run build` |
| Start command | `npm run start:prod` |
| Watch patterns | None (empty): any commit on the connected branch can trigger a redeploy |
| Public URL | `https://api.everycountryisunique.com` |

The Nest process listens on `process.env.PORT` (injected by Railway) and binds `0.0.0.0`. In production, TypeORM uses `synchronize: false`; schema changes go through migrations only.

There is an optional `backend/Dockerfile` for local/Docker workflows. Production on Railway uses the Railpack settings above, not that Dockerfile.

### Frontend (Vercel)

| Setting | Value |
|---------|--------|
| Project | `physicalattractions-projects/frontend` |
| App directory | `frontend/` |
| Production env | `NEXT_PUBLIC_API_URL=https://api.everycountryisunique.com` (Production only) |
| Public URLs | Canonical `https://www.everycountryisunique.com`; apex redirects there (308) |

Do not set `NEXT_PUBLIC_API_URL` for Preview until CORS allows those origins. CORS on the API allows only:

- `https://everycountryisunique.com`
- `https://www.everycountryisunique.com`
- `http://localhost:3000`

Bare `*.vercel.app` preview origins are not allowed.

### Git deploy branches

Both platforms are Git-connected and track `main` for production (Railway `api` source branch and Vercel `frontend` production branch). Merges to `main` trigger production deploys on both.

## Environment variables

### Backend (Railway `api`)

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | `production` |
| `DB_HOST` | Postgres host (Railway reference, e.g. `${{Postgres.PGHOST}}`) |
| `DB_PORT` | Postgres port |
| `DB_USER` | Postgres user |
| `DB_PASSWORD` | Postgres password |
| `DB_NAME` | Postgres database name |
| `API_KEY` | Shared secret for `X-API-Key` write endpoints |
| `PORT` | Leave unset so Railway injects it |

Do not commit secrets. Generate a new API key with `openssl rand -hex 32` when rotating.

### Frontend (Vercel)

| Variable | Environments | Value |
|----------|--------------|--------|
| `NEXT_PUBLIC_API_URL` | Production | `https://api.everycountryisunique.com` |

## Domains and DNS

| Host | Purpose | Provider |
|------|---------|----------|
| `everycountryisunique.com` | Redirect to `www` (308) | Vercel |
| `www.everycountryisunique.com` | Frontend (canonical) | Vercel |
| `api.everycountryisunique.com` | API | Railway |

Full record types and values: [dns.md](dns.md). Keep nameservers at TransIP so `api` can stay on Railway while apex/`www` point at Vercel.

## Routine operations

### Deploy application code

- **API:** Push (or merge) to the Railway-connected branch. Build uses `/backend` as root.
- **Frontend:** Push (or merge) to the Vercel production branch, or deploy from `frontend/` with the Vercel CLI (`vercel --prod`).

### Database migrations

Run against the live API service (same env as production):

```bash
railway ssh --service api -i ~/.ssh/railway_ed25519 -- npm run migration:run
```

Confirm `NODE_ENV=production` and non-empty `DB_HOST` / `DB_NAME` before running destructive or schema work.

### Seed / import

- Base countries: `npm run seed` on the API service (Railway SSH), when appropriate.
- Demographics, borders, and puzzles: geogrid uploader with production credentials (`EciuUploader("production")` in the geogrid repo), targeting `https://api.everycountryisunique.com` with the production API key.

### Health checks

```bash
curl -sS https://api.everycountryisunique.com/health
curl -sS -o /dev/null -w "%{http_code}\n" https://everycountryisunique.com/
curl -sS -o /dev/null -w "%{http_code}\n" https://www.everycountryisunique.com/
```

API OpenAPI UI: `https://api.everycountryisunique.com/docs`.

### Spend and access

- Railway Hobby: keep a workspace spend limit set (soft/hard compute limits in **My Projects**).
- Railway SSH: use only `~/.ssh/railway_ed25519` for this project; do not register unrelated GitHub keys with Railway.
- Always confirm `railway status` shows project **every-country-is-unique** in workspace **My Projects** before deploy or variable changes.
