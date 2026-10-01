# Qaryati

Qaryati is a versioned REST API for structured, sourced, reviewed information about Palestinian villages.

## Stack

Node.js 22, TypeScript, Express 5, PostgreSQL 17, Prisma, Zod, pino, Jasmine, Docker, and GitHub Actions.

## Local development

Prerequisites: Node.js 22 and Docker with Compose.

```sh
cp .env.example .env
docker compose up --build
```

The API is available at `http://localhost:3000`; migrations can be applied with `docker compose run --rm api npx prisma migrate deploy`.

Run locally with `npm install`, a PostgreSQL database, and `npm run dev`. Run tests with `npm test`; run integration tests with `npm run test:integration`.

## Architecture

The project follows the modular monolith and layered dependency rules in `qaryati-starter-guide.md`. Future modules plug into the composition root in `src/container.ts`.
