# ADR-0001: Technology stack

## Context

Qaryati needs a maintainable API for a four-person team working in parallel, with strong validation, testing, and database tooling.

## Decision

Use Node.js 22 with strict TypeScript, Express 5, PostgreSQL 17, Prisma, Zod, pino, and Jasmine/Supertest. This combination is familiar to the team, has a small operational footprint, and supports the required API and transaction boundaries.

## Alternatives considered

NestJS provides more framework structure than the small initial skeleton needs. Spring and Django would introduce different languages and heavier conventions for this team and assignment.

## Consequences

The team must enforce module and layer boundaries through review. TypeScript gives compile-time safety, while Express leaves composition explicit and lightweight.
