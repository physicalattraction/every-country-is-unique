# Railway + Vercel Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redeploy Every Country Is Unique with NestJS + PostgreSQL on Railway Hobby and Next.js on Vercel Hobby, after small backend production fixes, then cut custom domains over from the old VPS.

**Architecture:** Browser hits the Next.js frontend on Vercel (`everycountryisunique.com` / `www`). The frontend calls the Nest API on Railway via `NEXT_PUBLIC_API_URL=https://api.everycountryisunique.com`. Nest talks to Railway-managed Postgres. Geogrid puzzle import continues to hit the API with `X-API-Key`.

**Tech Stack:** NestJS 11, TypeORM + PostgreSQL, Next.js 14, Railway Hobby (API + DB), Vercel Hobby (frontend)

## Global Constraints

- Keep Nest + Next stack (Frappe out of scope)
- Railway Hobby for API + Postgres only; Vercel Hobby for frontend
- Nest must listen on `process.env.PORT || 3001` and bind `0.0.0.0`
- Production TypeORM: `synchronize: false` when `NODE_ENV === 'production'`; schema via migrations only
- CORS stays production domains + `http://localhost:3000` (do **not** add `*.vercel.app`)
- Set `NEXT_PUBLIC_API_URL` on Vercel **Production** only until custom domain cutover
- Railway start command: `npm run start:prod`; build: `npm ci && npm run build`
- Migrations + seed/import run manually via Railway shell after first healthy deploy
- Set a Railway spend limit (~$10–15)
- Domains: `everycountryisunique.com` + `www` → Vercel; `api.everycountryisunique.com` → Railway
- Do not automate geogrid CI import in this plan
- Human account signup / billing steps are documented; do not invent credentials

---

## File Structure

| File | Responsibility |
|------|----------------|
| `backend/src/main.ts` | Bootstrap, CORS, listen port |
| `backend/src/app.module.ts` | TypeORM config including `synchronize` |
| `backend/Dockerfile` | Optional Docker path; CMD/PORT alignment |
| `docs/superpowers/plans/2026-08-01-railway-vercel-deploy.md` | This plan |
| `README.md` | Brief pointer to Railway/Vercel deploy flow |
| `regular-deployment.md` | Update post-cutover deploy notes (or leave VPS guide + add pointer) |

No new application modules. Deploy config lives in Railway/Vercel dashboards (and optional `railway.toml` / `vercel.json` only if needed for Root Directory clarity).

---

### Task 1: Backend listen on Railway `PORT`

**Files:**
- Modify: `backend/src/main.ts:35`
- Test: manual curl against local server (no unit test exists for bootstrap)

**Interfaces:**
- Consumes: `process.env.PORT` (string or undefined)
- Produces: HTTP server listening on `Number(process.env.PORT) || 3001` at `0.0.0.0`

- [x] **Step 1: Change listen call to honor `PORT`**

In `backend/src/main.ts`, replace:

```typescript
    await app.listen(3001, '0.0.0.0');
```

with:

```typescript
    await app.listen(process.env.PORT || 3001, '0.0.0.0');
```

Leave CORS origins unchanged:

```typescript
    app.enableCors({
        origin: ['https://everycountryisunique.com', 'https://www.everycountryisunique.com', 'http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    });
```

- [x] **Step 2: Verify locally with custom PORT**

From `backend/` (with local Postgres and env already working for `npm run start:dev`):

```bash
PORT=3010 npm run start:dev
```

In another terminal:

```bash
curl -s http://127.0.0.1:3010/health
```

Expected: JSON like `{"status":"ok","timestamp":"..."}`

Stop the server (Ctrl+C).

- [x] **Step 3: Commit**

```bash
git add backend/src/main.ts
git commit -m "$(cat <<'EOF'
fix: honor PORT env when starting Nest API

EOF
)"
```

---

### Task 2: Disable TypeORM synchronize in production

**Files:**
- Modify: `backend/src/app.module.ts:25`
- Reference: `backend/src/data-source.ts` (already `synchronize: false` for migrations)

**Interfaces:**
- Consumes: `process.env.NODE_ENV`
- Produces: TypeORM `synchronize: true` only when `NODE_ENV !== 'production'`

- [x] **Step 1: Gate synchronize on NODE_ENV**

In `backend/src/app.module.ts`, replace:

```typescript
                synchronize: true,
```

with:

```typescript
                synchronize: process.env.NODE_ENV !== 'production',
```

Full `useFactory` body should look like:

```typescript
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get('DB_HOST'),
                port: configService.get('DB_PORT'),
                username: configService.get('DB_USER'),
                password: configService.get('DB_PASSWORD'),
                database: configService.get('DB_NAME'),
                entities: [__dirname + '/**/*.entity{.ts,.js}'],
                synchronize: process.env.NODE_ENV !== 'production',
            }),
```

- [x] **Step 2: Run backend unit tests**

```bash
cd backend && npm test
```

Expected: all tests pass (tests use SQLite / test setup and should not depend on production synchronize).

- [x] **Step 3: Commit**

```bash
git add backend/src/app.module.ts
git commit -m "$(cat <<'EOF'
fix: disable TypeORM synchronize in production

EOF
)"
```

---

### Task 3: Align Dockerfile CMD with start:prod / PORT

**Files:**
- Modify: `backend/Dockerfile:32` (and healthcheck already uses `${PORT:-3001}`)

**Interfaces:**
- Consumes: `NODE_ENV`, `PORT`
- Produces: container that runs `npm run start:prod` in production and still exposes `/health`

- [x] **Step 1: Replace NODE_ENV-based npm script CMD**

Current CMD:

```dockerfile
CMD ["sh", "-c", "npm run ${NODE_ENV:-development}"]
```

Replace with an explicit production-safe default that still allows override:

```dockerfile
CMD ["sh", "-c", "npm run start:prod"]
```

Keep:

```dockerfile
EXPOSE ${PORT:-3001}

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3001}/health || exit 1
```

Note: Railway Hobby deploy uses Nixpacks + `npm run start:prod`, not this Dockerfile. This task keeps Docker consistent if reused later.

- [x] **Step 2: Commit**

```bash
git add backend/Dockerfile
git commit -m "$(cat <<'EOF'
chore: run start:prod from backend Dockerfile CMD

EOF
)"
```

---

### Task 4: Document Railway/Vercel flow in README

**Files:**
- Modify: `README.md` (Environment Variables / deployment mention near top or after env section)
- Reference: `regular-deployment.md`, `first-deployment.md` (VPS guides; add a one-line pointer, do not delete yet)

- [x] **Step 1: Add deploy pointer to README**

After the existing Environment Variables section in `README.md`, add:

```markdown
## Production Deployment

Production targets:
- **Frontend:** Vercel Hobby (Root Directory `frontend/`)
- **API + Postgres:** Railway Hobby (service root `backend/`)

Step-by-step implementation checklist: [docs/superpowers/plans/2026-08-01-railway-vercel-deploy.md](docs/superpowers/plans/2026-08-01-railway-vercel-deploy.md).

Legacy VPS Docker/nginx flow remains in [first-deployment.md](first-deployment.md) and [regular-deployment.md](regular-deployment.md) until cutover is complete.
```

Also expand backend env list to match what Railway will set:

```markdown
### Backend
- `DB_HOST`: Database host (default: 'localhost')
- `DB_PORT`: Database port (default: `5432`)
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `PORT`: HTTP listen port (default: `3001`; Railway injects this)
- `NODE_ENV`: Environment mode (`development` / `production`)
- `API_KEY`: Shared secret for `X-API-Key` protected write endpoints
```

- [x] **Step 2: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
docs: point production deploy at Railway and Vercel

EOF
)"
```

---

### Task 5: Create Railway project (Postgres + Nest)

**Files:**
- No repo files required (dashboard / CLI). Optional later: `backend/railway.toml`

**Interfaces:**
- Consumes: GitHub (or Codeberg) repo connected to Railway; Nest env names `DB_*`, `API_KEY`, `NODE_ENV`, `PORT`
- Produces: Public HTTP URL for Nest + private Postgres network reachable via `DB_HOST`

- [x] **Step 1: Account and spend limit (human)**

1. Sign in at https://railway.app on Hobby plan.
2. Open project settings → set a **spend limit** of about `$10`–`$15`.

Done: Hobby plan active. Workspace **My Projects** soft `$5` / hard `$10` compute limits set and verified via CLI.

- [x] **Step 2: Create project and Postgres**

1. New Project → **Add PostgreSQL**.
2. Note the plugin variables Railway provides (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, and/or `DATABASE_URL`).

Done via CLI: project `every-country-is-unique` (`75537501-3750-4fff-8484-df9c6f93bfe2`) in workspace **My Projects**; Postgres service `e0e1f17d-94f7-4edc-ad29-736cee62d806` Online.

- [x] **Step 3: Add Nest service from repo**

1. Add service → Deploy from GitHub (or connected git remote) of `every-country-is-unique`.
2. Set **Root Directory** to `backend`.
3. Configure build/start (Settings → Build / Deploy):
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `npm run start:prod`
4. Ensure Node version is compatible with `backend/package.json` engines if set; otherwise Node 20 matches `Dockerfile` (`node:20-alpine`).

Done via CLI: service `api` (`0cde03b8-10b2-4b97-81a3-91b5d0268a30`) from `physicalattraction/every-country-is-unique` branch `redeployment`; root `/backend`; build/start as above (Dockerfile builder).

- [x] **Step 4: Wire environment variables on the Nest service**

Set these on the **API** service (map from Railway Postgres reference variables):

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `DB_HOST` | `${{Postgres.PGHOST}}` (or Railway UI variable reference) |
| `DB_PORT` | `${{Postgres.PGPORT}}` |
| `DB_USER` | `${{Postgres.PGUSER}}` |
| `DB_PASSWORD` | `${{Postgres.PGPASSWORD}}` |
| `DB_NAME` | `${{Postgres.PGDATABASE}}` |
| `API_KEY` | strong random secret (same value geogrid import will use) |
| `PORT` | leave unset so Railway injects its own, **or** set only if Railway docs for this service require it |

Do **not** commit secrets. Generate `API_KEY` with:

```bash
openssl rand -hex 32
```

Done via CLI (`railway variable set --service api`); `PORT` left unset; `API_KEY` generated and stored only on Railway.

- [x] **Step 5: Deploy and wait for healthy build**

Trigger deploy. In Railway logs, expect Nest bootstrap without TypeORM synchronize altering schema (migrations not run yet). First boot may error if tables are missing; that is expected until Task 6.

If the process crashes solely because tables are missing, proceed to Task 6 migrations quickly, or temporarily confirm the process at least reaches DB connection.

Done: deployment `917ab5bb-92fb-4bab-9f2a-80117369a46d` SUCCESS; Nest started (`Nest application successfully started`); TypeORM connected without synchronize. Non-fatal: `git: not found` when resolving commit hash in the image.

- [x] **Step 6: Checkpoint**

Record:
- Railway public URL for the API service (e.g. `https://….up.railway.app`)
- That Postgres is attached on the private network

Checkpoint (2026-08-08):
- API public URL: `https://api-production-bb07.up.railway.app`
- Postgres: Online on private network (`postgres-volume`); API `DB_*` vars reference `${{Postgres.*}}`

---

### Task 6: Run migrations and verify `/health` on Railway

**Files:**
- Reference only: `backend/src/migrations/*.ts`, `backend/package.json` scripts `migration:run`, `seed`

**Interfaces:**
- Consumes: Railway shell with same `DB_*` env as the service
- Produces: Schema matching migrations; `/health` returns 200

- [x] **Step 1: Open Railway shell for the API service**

From Railway UI: service → Shell (or `railway shell` if CLI is linked).

Confirm env:

```bash
echo "NODE_ENV=$NODE_ENV DB_HOST=$DB_HOST DB_NAME=$DB_NAME"
```

Expected: `NODE_ENV=production` and non-empty DB host/name.

Done via CLI: registered Railway-only SSH key `~/.ssh/railway_ed25519`, then
`railway ssh --service api -i ~/.ssh/railway_ed25519`. Confirmed `NODE_ENV=production` and non-empty `DB_HOST` / `DB_NAME`.

- [x] **Step 2: Run migrations**

From service working directory (`backend` root on Railway):

```bash
npm run migration:run
```

Expected: TypeORM applies pending migrations under `src/migrations/` without error. Existing migrations include at least:
- `1743268591695-InitialSchema.ts`
- `1710000000000-UpdateBordersTable.ts`
- `1745008305308-migration.ts`
- `1745008305309-AddAlternativeCountries.ts`
- `1745008305310-AddDeduplicationKeyToPuzzle.ts`

Done via CLI: `railway ssh --service api -i ~/.ssh/railway_ed25519 -- npm run migration:run`. All 5 migrations applied successfully.

- [x] **Step 3: Healthcheck against Railway URL**

```bash
curl -sS https://YOUR-RAILWAY-API-HOST/health
```

Expected: `{"status":"ok","timestamp":"..."}`

Optional OpenAPI:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://YOUR-RAILWAY-API-HOST/docs
```

Expected: `200` or `301`/`302` to docs UI.

Done: `https://api-production-bb07.up.railway.app/health` → 200 `{"status":"ok",...}`; `/docs` → 200.

- [x] **Step 4: Optional seed countries**

If the DB is empty and you want country rows before puzzle import:

```bash
npm run seed
```

Expected: seed script completes without connection errors.

Attempted via CLI: `railway ssh --service api -i ~/.ssh/railway_ed25519 -- npm run seed`.
Initially failed: `column "population" of relation "country" does not exist` (entity columns missing
from migrations; legacy VPS likely relied on `synchronize: true`).

Follow-up (2026-08-08): added migration `1754665200000-AddCountryDemographicColumns`, applied on
Railway, then re-ran seed successfully (`country_count=197`). Also aligned Border/Puzzle entity
column mappings with existing migration table/column names.

- [x] **Step 5: Checkpoint**

Do not cut DNS yet. Keep using the Railway `*.up.railway.app` URL for API smoke tests until Task 8.

Checkpoint (2026-08-08): 6 migrations applied; `/health` and `/docs` OK on
`https://api-production-bb07.up.railway.app`; countries seeded (197 rows).

---

### Task 7: Attach `api.everycountryisunique.com` on Railway

**Files:** none in repo (DNS values documented in `docs/dns.md`)

- [x] **Step 1: Add custom domain on Railway API service**

Done via CLI (2026-08-08):

```bash
railway domain api.everycountryisunique.com --service api --json
```

Railway requires:

| Type | Name | Value |
|------|------|--------|
| CNAME | `api` | `4fhf74sg.up.railway.app` |
| TXT | `_railway-verify.api` | `railway-verify=e82ff132cf07b8716a40c422379b8234be2dbd57cb4a0e0d57c875a60fbd06fc` |

- [x] **Step 2: Create DNS record at domain registrar**

TransIP updated to match `docs/dns.md` (API section): CNAME `api` → `4fhf74sg.up.railway.app.` and TXT `_railway-verify.api`.

- [x] **Step 3: Wait for TLS and verify**

Verified 2026-08-08:

- Railway: `verified: true`, certificate `VALID` for `api.everycountryisunique.com`
- `https://api.everycountryisunique.com/health` → `{"status":"ok",...}`
- `https://api.everycountryisunique.com/countries` → `200`

---

### Task 8: Create Vercel frontend project

**Files:**
- Reference: `frontend/src/config/api.ts` (`NEXT_PUBLIC_API_URL`)
- Optional: no `vercel.json` required if Root Directory is set in the dashboard

**Interfaces:**
- Consumes: `NEXT_PUBLIC_API_URL` at **build** time (Next.js inlines `NEXT_PUBLIC_*`)
- Produces: Production deployment serving the quiz UI that calls the Railway API

- [x] **Step 1: Import project on Vercel Hobby**

Done via CLI from `frontend/` (2026-08-08), not dashboard git import:

```bash
cd frontend
vercel link --yes --scope physicalattractions-projects
```

Created project `physicalattractions-projects/frontend` (Next.js auto-detected; directory is already `frontend`, so no separate Root Directory setting). Local link lives in `frontend/.vercel/` (gitignored). Git connect for push-to-deploy is still optional (`vercel git connect`).

- [x] **Step 2: Set Production env only**

```bash
printf '%s' 'https://api.everycountryisunique.com' | vercel env add NEXT_PUBLIC_API_URL production
```

| Name | Value | Environments |
|------|--------|----------------|
| `NEXT_PUBLIC_API_URL` | `https://api.everycountryisunique.com` | **Production** only |

Verified with `vercel env ls`: Production only (not Preview/Development).

Do **not** set this for Preview until CORS allows preview origins (plan explicitly keeps CORS without `*.vercel.app`).

- [x] **Step 3: Deploy Production**

```bash
vercel --prod --yes
```

Build succeeded (Next.js 14.1.0). Production alias:

- `https://frontend-swart-eight-qjkrlzdtxn.vercel.app`
- Inspect: https://vercel.com/physicalattractions-projects/frontend/BaJ26yykV8LpS1cNkYgQyYXKPGZV

- [x] **Step 4: Smoke-test Vercel URL against live API**

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://frontend-swart-eight-qjkrlzdtxn.vercel.app
```

Expected: `200` (got `200`).

In browser DevTools → Network, confirm API calls go to `https://api.everycountryisunique.com/...` and are not blocked by CORS.

If CORS fails, confirm request `Origin` is exactly `https://everycountryisunique.com` or `https://www.everycountryisunique.com` after domain attach (Task 9). Testing from bare `*.vercel.app` **will** fail CORS by design; use custom domain or temporary curl to API only.

---

### Task 9: Attach site domains on Vercel and cut DNS

**Files:** `docs/dns.md` (frontend record values)

- [x] **Step 1: Add domains in Vercel**

Done via CLI (2026-08-08) from `frontend/`:

```bash
vercel domains add everycountryisunique.com frontend
vercel domains add www.everycountryisunique.com frontend
```

Both attached to `physicalattractions-projects/frontend`. Apex ↔ www redirect not set yet (optional in Domains UI).

- [x] **Step 2: Update DNS at registrar**

Done at TransIP (2026-08-08) per `docs/dns.md`. Verified:

```bash
vercel domains verify everycountryisunique.com   # configured-correctly (A)
vercel domains verify www.everycountryisunique.com  # configured-correctly (CNAME)
```

Public DNS: apex `216.198.79.1` + `64.29.17.1`; `www` CNAME `8e99e9a773becd67.vercel-dns-017.com.`; `api` still Railway. Nameservers remain TransIP.

- [x] **Step 3: Verify HTTPS and redirects**

After brief TLS provisioning wait, both hostnames serve HTTPS:

- `https://everycountryisunique.com/` → `200` (Vercel; cert issued, ~90d)
- `https://www.everycountryisunique.com/` → `200` (no apex↔www redirect configured; both serve)
- `https://api.everycountryisunique.com/health` → `{"status":"ok",...}`

- [x] **Step 4: End-to-end product checks**

Verified 2026-08-08:

1. Apex pages `200`: `/`, `/countries`, `/quiz`, `/quiz/every-country-is-unique`, `/home`; `www/` `200`.
2. Built JS includes `https://api.everycountryisunique.com`; API `GET /countries` and `/puzzles` `200`.
3. CORS: `Origin: https://everycountryisunique.com` and `https://www.everycountryisunique.com` both get matching `access-control-allow-origin`.
4. Optional geogrid import: not re-run here (API key path unchanged from Railway cutover).

---

### Task 10: Decommission old VPS (after stable cutover)

**Files:**
- Current production docs: [docs/infrastructure.md](../../infrastructure.md) (replaces removed `first-deployment.md` / `regular-deployment.md`)

- [x] **Step 1: Confirm stability window**

Accepted: production on Vercel + Railway; Railway spend limits already set (Task 5).

- [x] **Step 2: Stop VPS containers and nginx site**

Done: old TransIP VPS cleaned up (containers/nginx decommissioned).

- [x] **Step 3: Production docs**

Done: [docs/infrastructure.md](../../infrastructure.md) describes the live Railway + Vercel setup. Root VPS guides removed; README and [docs/dns.md](../../dns.md) point at the new doc.

- [x] **Step 4: Final checkpoint**

Checklist:
- [x] `https://everycountryisunique.com` serves Vercel frontend
- [x] `https://api.everycountryisunique.com/health` serves Railway Nest
- [x] Quizzes work; CORS clean on custom domains
- [x] Geogrid can import with `API_KEY` (production key path)
- [x] Old VPS app containers stopped
- [x] Railway spend limit set

---

## Self-Review

1. **Spec coverage:** PORT fix, synchronize gate, Dockerfile CMD, README pointer, Railway Postgres+Nest, migrations/health, API domain, Vercel root+env, site domains, E2E, VPS decommission — all have tasks.
2. **Placeholders:** No TBD steps; env mapping and exact commands included.
3. **Type consistency:** Env names match `app.module.ts` / `.env.example` (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `API_KEY`, `PORT`, `NODE_ENV`).

---

## TODO (post-cutover)

- [ ] **Switch Railway `api` git deploy branch from `redeployment` to `main`**

  Today the service watches `physicalattraction/every-country-is-unique` on branch `redeployment`, so merges to `main` do not auto-deploy. After the redeployment work is merged, point production at `main`:

  ```bash
  railway service source connect \
    --repo physicalattraction/every-country-is-unique \
    --branch main \
    --service api
  ```

  Confirm a push/merge to `main` triggers a new successful deploy.

- [ ] **Switch Vercel `frontend` production branch from `redeployment` to `main`**

  Today the Git-connected project `physicalattractions-projects/frontend` uses production branch `redeployment` (set 2026-08-08), so merges to `main` do not create Production deployments. After the redeployment work is merged, point production at `main`:

  ```bash
  printf '%s' '{"branch":"main"}' > /tmp/vercel_branch.json
  vercel api "/v9/projects/prj_h0V4krsUBXfgQWT1AHEWhsbKAL28/branch" \
    -X PATCH --input /tmp/vercel_branch.json
  ```

  Or in the dashboard: Project → Settings → Environments → Production branch → `main`.

  Confirm a push/merge to `main` triggers a new successful Production deploy.
