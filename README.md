# Every Country Is Unique

A full-stack web application that provides puzzles and detailed information about countries around the world. The application consists of a NestJS backend API and a Next.js frontend, both containerized with Docker.

## Status of the project

Current status: ECIU puzzles are almost working, but there are some issues
- To be deployed to the ECIU server

Known data issues:
- Has never won a Summer Olympics gold medal -> USA ?

Next step: Show the other countries when one of the clues is absent
- The puzzles are created from another repository through the API
- Show the other countries when one of the clues is absent
- Data model, API, frontend, upload script

Other improvement ideas
- Do not call the backend from the page in frontend, but define a Service
- Only fetch country data once
- Display country data used in puzzles in country overview (data model, API, frontend, upload script)
- Use real flags instead of emojis
- Make sources public
- Update the source extraction repository
- Add frontend tests (currently none; backend has Jest specs)

## Project Structure

```
.
├── backend/             # NestJS backend application
│   ├── data/            # OpenAPI documentation
│   ├── src/
│   ├── Dockerfile
│   └── docker-compose.yml
├── frontend/           # Next.js frontend application
│   ├── public/         # Static files (images, etc.)
│   ├── src/
│   ├── Dockerfile
│   └── docker-compose.yml
```

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- PostgreSQL (handled via Docker)

## Getting Started

### Running with Docker

1. Start the Backend:
```bash
cd backend
docker compose up --build -d
```

2. Start the Frontend:
```bash
cd frontend
docker compose up --build -d
```

The applications will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/docs

### First-Time Deployment Guide

For detailed instructions on deploying the application to production for the first time, including initial server setup, SSL certification, and nginx configuration, see [First-Time Deployment Guide](first-deployment.md).

### Regular Deployment Guide

For instructions on deploying updates to the application after initial deployment, see [Regular Deployment Guide](regular-deployment.md).

### Local Development

1. Backend Setup:
```bash
cd backend
npm install
npm run development
```

2. Frontend Setup:
```bash
cd frontend
npm install
npm run development
```

### Database Seeding

Populate the database in three steps. The backend must be running locally (`http://localhost:3001`), and `API_KEY` in the backend env must match `ECIU_API_KEY_DEVELOPMENT` in the sibling [geogrid](https://codeberg.org/erwinrossen/geogrid) repo (`data/eciu/secrets.json`).

1. **Seed base countries** (code, name, flag, currencies, languages):

```bash
cd backend
npm run seed
```

2. **Add demographics and borders** from geogrid (population, area, population density, landlocked, bordering countries):

```bash
cd ../geogrid   # or your local checkout of geogrid
PYTHONPATH=src python3 -c 'from _60_eciu_uploader.eciu_uploader import EciuUploader; EciuUploader("development").bulk_update_countries()'
```

3. **Upload puzzles** from geogrid JSON files (`data/eciu-website/puzzles/`) via the API:

```bash
PYTHONPATH=src python3 -c 'from _60_eciu_uploader.eciu_uploader import EciuUploader; EciuUploader("development").upsert_existing_puzzles()'
```

For production, use `EciuUploader("production")` instead (targets `https://api.everycountryisunique.com` with `ECIU_API_KEY_PRODUCTION`).

## API Documentation

The API documentation is automatically generated using OpenAPI (Swagger) and can be accessed in two ways:
1. Through the browser at http://localhost:3001/docs when the backend is running
2. By viewing the static OpenAPI specification at `data/docs/openapi.json`

## Environment Variables

### Backend
- `DB_HOST`: Database host (default: 'localhost')
- `DB_PORT`: Database port (default: `5432`)
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `PORT`: HTTP listen port (default: `3001`; Railway injects this)
- `NODE_ENV`: Environment mode (`development` / `production`)
- `API_KEY`: Shared secret for `X-API-Key` protected write endpoints

### Frontend
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: 'http://localhost:3001')

## Production Deployment

Production targets:
- **Frontend:** Vercel Hobby (Root Directory `frontend/`)
- **API + Postgres:** Railway Hobby (service root `backend/`)

Step-by-step implementation checklist: [docs/superpowers/plans/2026-08-01-railway-vercel-deploy.md](docs/superpowers/plans/2026-08-01-railway-vercel-deploy.md).

Legacy VPS Docker/nginx flow remains in [first-deployment.md](first-deployment.md) and [regular-deployment.md](regular-deployment.md) until cutover is complete.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request to `main` branch

## License

CC BY-NC 4.0
This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License. See the [LICENSE](LICENSE) file for details.
