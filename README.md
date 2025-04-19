# Every Country Is Unique

A full-stack web application that provides puzzles and detailed information about countries around the world. The application consists of a NestJS backend API and a Next.js frontend, both containerized with Docker.

## Status of the project

Current status: ECIU puzzles are almost working, but there are some issues
- In a local development server, the ECIU puzzles are working, but the popup is showing up on top of the buttons
- In a local Docker container, the popup doesn't show up at all, and you cannot click on the buttons
- The CRUD APIs are working, but there is no authentication (should be there for create, update, delete)
- To be deployed to the ECIU server

Next step: Show the other countries when one of the clues is absent
- The puzzles are created from another repository through the API
- Show the other countries when one of the clues is absent
- Data model, API, frontend, upload script

Other improvement ideas
- Add a loading spinner when fetching data
- Only fetch country data once
- Display country data used in puzzles in country overview (data model, API, frontend, upload script)
- Use real flags instead of emojis
- Make sources public
- Update the source extraction repository

## Project Structure

```
.
├── backend/             # NestJS backend application
│   ├── src/
│   ├── Dockerfile
│   └── docker-compose.yml
├── frontend/           # Next.js frontend application
│   ├── src/
│   ├── Dockerfile
│   └── docker-compose.yml
└── data/              # Shared data files
    ├── docs/          # API documentation
    └── rest_countries.json
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

To populate the database with country data:
```bash
cd backend
npm run seed
```
Note that the puzzles are created from another repository through the API.

## API Documentation

The API documentation is automatically generated using OpenAPI (Swagger) and can be accessed in two ways:
1. Through the browser at http://localhost:3001/docs when the backend is running
2. By viewing the static OpenAPI specification at `data/docs/openapi.json`

## Environment Variables

### Backend
- `DB_HOST`: Database host (default: 'localhost')
- `NODE_ENV`: Environment mode (development/production)

### Frontend
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: 'http://localhost:3001')

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request to `main` branch

## License

CC BY-NC 4.0
This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License. See the [LICENSE](LICENSE) file for details.
