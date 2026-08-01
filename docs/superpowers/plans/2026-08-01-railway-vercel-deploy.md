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

- [ ] **Step 1: Account and spend limit (human)**

1. Sign in at https://railway.app on Hobby plan.
2. Open project settings → set a **spend limit** of about `$10`–`$15`.

- [ ] **Step 2: Create project and Postgres**

1. New Project → **Add PostgreSQL**.
2. Note the plugin variables Railway provides (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, and/or `DATABASE_URL`).

- [ ] **Step 3: Add Nest service from repo**

1. Add service → Deploy from GitHub (or connected git remote) of `every-country-is-unique`.
2. Set **Root Directory** to `backend`.
3. Configure build/start (Settings → Build / Deploy):
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `npm run start:prod`
4. Ensure Node version is compatible with `backend/package.json` engines if set; otherwise Node 20 matches `Dockerfile` (`node:20-alpine`).

- [ ] **Step 4: Wire environment variables on the Nest service**

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

- [ ] **Step 5: Deploy and wait for healthy build**

Trigger deploy. In Railway logs, expect Nest bootstrap without TypeORM synchronize altering schema (migrations not run yet). First boot may error if tables are missing; that is expected until Task 6.

If the process crashes solely because tables are missing, proceed to Task 6 migrations quickly, or temporarily confirm the process at least reaches DB connection.

- [ ] **Step 6: Checkpoint**

Record:
- Railway public URL for the API service (e.g. `https://….up.railway.app`)
- That Postgres is attached on the private network

---

### Task 6: Run migrations and verify `/health` on Railway

**Files:**
- Reference only: `backend/src/migrations/*.ts`, `backend/package.json` scripts `migration:run`, `seed`

**Interfaces:**
- Consumes: Railway shell with same `DB_*` env as the service
- Produces: Schema matching migrations; `/health` returns 200

- [ ] **Step 1: Open Railway shell for the API service**

From Railway UI: service → Shell (or `railway shell` if CLI is linked).

Confirm env:

```bash
echo "NODE_ENV=$NODE_ENV DB_HOST=$DB_HOST DB_NAME=$DB_NAME"
```

Expected: `NODE_ENV=production` and non-empty DB host/name.

- [ ] **Step 2: Run migrations**

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

- [ ] **Step 3: Healthcheck against Railway URL**

```bash
curl -sS https://YOUR-RAILWAY-API-HOST/health
```

Expected: `{"status":"ok","timestamp":"..."}`

Optional OpenAPI:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://YOUR-RAILWAY-API-HOST/docs
```

Expected: `200` or `301`/`302` to docs UI.

- [ ] **Step 4: Optional seed countries**

If the DB is empty and you want country rows before puzzle import:

```bash
npm run seed
```

Expected: seed script completes without connection errors.

- [ ] **Step 5: Checkpoint**

Do not cut DNS yet. Keep using the Railway `*.up.railway.app` URL for API smoke tests until Task 8.

---

### Task 7: Attach `api.everycountryisunique.com` on Railway

**Files:** none in repo

- [ ] **Step 1: Add custom domain on Railway API service**

Railway service → Settings → Domains → add `api.everycountryisunique.com`.

Copy the DNS target Railway shows (CNAME or provided host).

- [ ] **Step 2: Create DNS record at domain registrar**

Create:

| Type | Name | Target |
|------|------|--------|
| CNAME | `api` | (Railway-provided hostname) |

If the old VPS still has `api` A/AAAA records, **replace** them with the Railway CNAME (or remove A/AAAA and add CNAME). Do this when ready for API cutover; TTL 300s recommended during cutover.

- [ ] **Step 3: Wait for TLS and verify**

```bash
curl -sS https://api.everycountryisunique.com/health
```

Expected: `{"status":"ok","timestamp":"..."}`

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://api.everycountryisunique.com/countries
```

Expected: `200` (or empty list `[]` with 200 if seeded/imported).

---

### Task 8: Create Vercel frontend project

**Files:**
- Reference: `frontend/src/config/api.ts` (`NEXT_PUBLIC_API_URL`)
- Optional: no `vercel.json` required if Root Directory is set in the dashboard

**Interfaces:**
- Consumes: `NEXT_PUBLIC_API_URL` at **build** time (Next.js inlines `NEXT_PUBLIC_*`)
- Produces: Production deployment serving the quiz UI that calls the Railway API

- [ ] **Step 1: Import project on Vercel Hobby**

1. Sign in at https://vercel.com.
2. Import `every-country-is-unique` git repository.
3. Set **Root Directory** to `frontend`.
4. Framework Preset: Next.js (auto).
5. Build Command: `next build` (default) / Install: `npm install` or `npm ci`.

- [ ] **Step 2: Set Production env only**

In Project → Settings → Environment Variables, add:

| Name | Value | Environments |
|------|--------|----------------|
| `NEXT_PUBLIC_API_URL` | `https://api.everycountryisunique.com` | **Production** only |

Do **not** set this for Preview until CORS allows preview origins (plan explicitly keeps CORS without `*.vercel.app`).

- [ ] **Step 3: Deploy Production**

Trigger a Production deployment (push to production branch or Deploy).

Verify build log shows Next.js build succeeding.

- [ ] **Step 4: Smoke-test Vercel URL against live API**

Open the Production deployment URL in a browser (after Task 7 DNS for API is live).

Or:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://YOUR-VERCEL-APP.vercel.app
```

Expected: `200`.

In browser DevTools → Network, confirm API calls go to `https://api.everycountryisunique.com/...` and are not blocked by CORS.

If CORS fails, confirm request `Origin` is exactly `https://everycountryisunique.com` or `https://www.everycountryisunique.com` after domain attach (Task 9). Testing from bare `*.vercel.app` **will** fail CORS by design; use custom domain or temporary curl to API only.

---

### Task 9: Attach site domains on Vercel and cut DNS

**Files:** none in repo

- [ ] **Step 1: Add domains in Vercel**

Project → Settings → Domains → add:
- `everycountryisunique.com`
- `www.everycountryisunique.com`

Follow Vercel’s redirect preference (apex ↔ www) consistently with current user preference.

- [ ] **Step 2: Update DNS at registrar**

Replace old VPS A/AAAA (or CNAME) for apex and `www` with Vercel’s records (typically A `76.76.21.21` for apex and CNAME `www` → `cname.vercel-dns.com`, or whatever Vercel UI shows **today**).

Keep `api` pointing at Railway (Task 7).

- [ ] **Step 3: Verify HTTPS and redirects**

```bash
curl -I https://everycountryisunique.com
curl -I https://www.everycountryisunique.com
curl -sS https://api.everycountryisunique.com/health
```

Expected: frontend `200` (or redirect then `200`); API health JSON ok.

- [ ] **Step 4: End-to-end product checks**

In a browser on the custom domain:
1. Home page loads.
2. A quiz/puzzle loads countries from the API (Network tab: `GET …/puzzles` or `GET …/countries`).
3. No CORS errors in console.
4. Optional: geogrid import against `https://api.everycountryisunique.com` with header `X-API-Key: <same API_KEY>` succeeds (POST/PUT as geogrid already does).

---

### Task 10: Decommission old VPS (after stable cutover)

**Files:**
- Modify: `regular-deployment.md` (add deprecation banner at top)
- Optional: leave `first-deployment.md` as historical VPS guide

- [ ] **Step 1: Confirm stability window**

Run production for an agreed window (e.g. 24–48 hours) with no rollback need. Confirm Railway spend is within limit.

- [ ] **Step 2: Stop VPS containers and nginx site**

On the old VPS (only after DNS fully points at Vercel/Railway):

```bash
ssh eciu
cd /webapps/every-country-is-unique/backend && sudo NODE_ENV=production docker-compose down
cd /webapps/every-country-is-unique/frontend && sudo NODE_ENV=production docker-compose down
sudo nginx -t
# disable site if still installed
sudo rm -f /etc/nginx/sites-enabled/everycountryisunique
sudo systemctl reload nginx
```

Do **not** delete Postgres volume until a Railway backup/export is confirmed if you still need historical data.

- [ ] **Step 3: Banner on regular-deployment.md**

At the top of `regular-deployment.md`, add:

```markdown
> **Deprecated for production:** Site and API now run on Vercel + Railway.
> See [docs/superpowers/plans/2026-08-01-railway-vercel-deploy.md](docs/superpowers/plans/2026-08-01-railway-vercel-deploy.md)
> and the Production Deployment section in [README.md](README.md).
> The steps below apply only to the legacy VPS Docker/nginx setup.
```

- [ ] **Step 4: Commit docs**

```bash
git add regular-deployment.md
git commit -m "$(cat <<'EOF'
docs: mark VPS regular deployment as deprecated after cutover

EOF
)"
```

- [ ] **Step 5: Final checkpoint**

Checklist:
- [ ] `https://everycountryisunique.com` serves Vercel frontend
- [ ] `https://api.everycountryisunique.com/health` serves Railway Nest
- [ ] Quizzes work; CORS clean on custom domains
- [ ] Geogrid can import with `API_KEY`
- [ ] Old VPS app containers stopped
- [ ] Railway spend limit set

---

## Self-Review

1. **Spec coverage:** PORT fix, synchronize gate, Dockerfile CMD, README pointer, Railway Postgres+Nest, migrations/health, API domain, Vercel root+env, site domains, E2E, VPS decommission — all have tasks.
2. **Placeholders:** No TBD steps; env mapping and exact commands included.
3. **Type consistency:** Env names match `app.module.ts` / `.env.example` (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `API_KEY`, `PORT`, `NODE_ENV`).
