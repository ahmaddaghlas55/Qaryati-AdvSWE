# Qaryati: Team Decisions

**Status:** draft for team agreement
**Deadline:** 1 December 2026

Each decision below needs one owner and a status: **agreed**, **open**, or **deferred**. Decisions that involve a real trade-off need an ADR in `docs/adr/`.

## Stack and environment

| # | Decision | Options / notes | Owner | Status |
|---|---|---|---|---|
| 1 | Node version | Rulebook says Node 20, Dockerfile uses Node 22. Pick one and make both match. | | open |
| 2 | Password hashing | bcrypt or argon2 | | open |
| 3 | Token type and lifetime | JWT access token length; whether a refresh token exists | | open |
| 4 | Logging library and format | pino or winston; correlation ID per request | | open |
| 5 | Caching | In-memory LRU only, or add Redis as a container | | open |
| 6 | Environment config | Which variables exist; validated only in `src/config` | | open |

## Architecture and boundaries

| # | Decision | Options / notes | Owner | Status |
|---|---|---|---|---|
| 7 | Architecture style | Layered (per rulebook) or another style. Record the comparison (spec requirement). | | open |
| 8 | Shared code | What goes in `src/shared/` (errors, logger, auth middleware) vs. modules | | open |
| 9 | Transaction boundaries | Which multi-step writes must be atomic (e.g. village + first name) | | open |
| 10 | DTO and mapping | Whether responses are mapped in the service or the controller | | open |

## Roles and permissions

| # | Decision | Options / notes | Owner | Status |
|---|---|---|---|---|
| 11 | Roles | e.g. public, contributor, verifier, admin | | open |
| 12 | Permissions per action | Who can create, edit, verify, and remove each data type (villages, names, population, sources, events) | | open |
| 13 | Verification flow | Contributor proposals stay `proposed` until a verifier approves | | open |
| 14 | Removal rule | Soft delete only; who can restore | | open |

## Data and history

| # | Decision | Options / notes | Owner | Status |
|---|---|---|---|---|
| 15 | Public visibility | History shows `verified` and `superseded` names only (agreed by Mah). Confirm and write ADR. | | agreed (confirm) |
| 16 | Population validation | What is invalid: negative value, future year, duplicate year per village | | open |
| 17 | Conflicting data | Keep both records with a status; never overwrite silently | | open |
| 18 | Audit log | Actor, action, entity, before/after values, time; append-only | | open |
| 19 | Governorate `updatedAt` | Add with a migration, or document as omitted | | open |
| 20 | Indexes | Which columns get indexes (village slug, governorate id, population year), chosen before k6 | | open |

## External API

| # | Decision | Options / notes | Owner | Status |
|---|---|---|---|---|
| 21 | Provider | Which geocoding service, and how it is configured | | open |
| 22 | Timeout | Timeout value, and behaviour after timeout (endpoint still returns without geo data) | | open |
| 23 | Retry policy | Retry or not, and why. Suggested: no retry on user-facing reads. | | open |
| 24 | Rate limit | Provider limit, and how the app stays under it | | open |
| 25 | Cache | What is cached, for how long, and what must not be cached | | open |

## Security

| # | Decision | Options / notes | Owner | Status |
|---|---|---|---|---|
| 26 | CORS | Allowed origins | | open |
| 27 | Rate limiting | Limits per IP; stricter limits on login | | open |
| 28 | Secret handling | Which secrets exist; `.env` locally, never committed | | open |

## API design

| # | Decision | Options / notes | Owner | Status |
|---|---|---|---|---|
| 29 | Versioning | `/api/v1/` for all routes (spec requirement) | | agreed |
| 30 | Error format | `code`, `message`, `details`, `requestId`, `timestamp` (already in use) | | agreed |
| 31 | Pagination defaults | page 1, pageSize 20, max 100 (already built) | | agreed |
| 32 | Default sort orders | Per list endpoint | | open |
| 33 | API documentation | API-Dog or equivalent; where the exported file lives | | open |

## Testing and performance

| # | Decision | Options / notes | Owner | Status |
|---|---|---|---|---|
| 34 | Test split | Unit (fake repository) vs. integration (real database); where integration tests live | | open |
| 35 | Performance target | k6 scenarios, metric thresholds, and the one optimization measured before/after | | open |

## Delivery and documentation

| # | Decision | Options / notes | Owner | Status |
|---|---|---|---|---|
| 36 | Docker | One command starts the whole system; whether the Docker build runs in CI | | open |
| 37 | Git workflow | Confirm rulebook as written, including who can merge | | open |
| 38 | ADR list | At least three. Recommended: history visibility, database port change, caching choice | | open |
| 39 | README contents | Required sections per spec | | open |

## Ownership

| # | Decision | Options / notes | Owner | Status |
|---|---|---|---|---|
| 40 | Owner per mandatory area | One named person and a deadline per item, before 1 December | | open |