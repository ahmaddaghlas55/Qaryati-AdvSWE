# ADR-0005: Prisma and raw SQL policy

## Context

The application needs schema-first migrations, transactions, typed database access, and a small number of specialized queries.

## Decision

Use Prisma for ordinary repository access, migrations, and `$transaction`. Use parameterized `$queryRaw` only for queries that are difficult or inefficient to express through the ORM, such as nearby-village distance searches, trigram search, and population aggregates.

## Alternatives considered

TypeORM was considered, but Prisma provides a clearer generated client and schema workflow for this project. Building a SQL-only data layer would lose useful type generation.

## Consequences

Most database code is typed and consistent. Raw SQL needs careful parameterization, review, and focused tests.
