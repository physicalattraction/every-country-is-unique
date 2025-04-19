# Every Country Is Unique

A full-stack web application that provides detailed information about countries around the world. The application consists of a NestJS backend API and a Next.js frontend, both containerized with Docker.

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

## Features

- Browse and search through all countries
- View detailed country information including:
  - Official country codes
  - National flags
  - Currencies
  - Languages
- Real-time search functionality
- Responsive design
- API documentation

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
npm run start:dev
```

2. Frontend Setup:
```bash
cd frontend
npm install
npm run dev
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
5. Create a Pull Request

## License

CC BY-NC 4.0