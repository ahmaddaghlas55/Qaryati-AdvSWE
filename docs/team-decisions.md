# Qaryati: Team Decisions

**Status:** draft for team agreement
**Deadline:** 1 December 2026

Each decision needs one owner and a status: **agreed**, **open**, or **deferred**. Decisions that involve a real trade-off have an ADR in `docs/adr/`.

## Stack and environment

| # | Decision | Options / notes | Owner | Status |
|---|---|---|---|---|
| 1 | Node version | Rulebook and ci.yml say Node 20; Dockerfile uses Node 22. Choose one and update ci.yml, Dockerfile, and rulebook to match (ADR-0001 says 22). | | open |
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
| 33 | API documentation | Spec requires API-Dog or an equivalent agreed tool. Postman + OpenAPI is proposed (ADR-0012), not agreed. Confirm with instructor/team. | | open |

## Testing and performance

| # | Decision | Options / notes | Owner | Status |
|---|---|---|---|---|
| 34 | Test split | Unit (fake repository) vs. integration (real database); where integration tests live | | open |
| 35 | Performance tests | k6, 50 VUs for 5 minutes. Two required scenarios: read-heavy (village list/detail/search) and authenticated write (create/update). Record p95, throughput, error rate, one measured bottleneck, and before/after. | | open |

## Delivery and documentation

| # | Decision | Options / notes | Owner | Status |
|---|---|---|---|---|
| 36 | Docker | One command starts the system (docker compose up --build). Local DB host port is 5434 (agreed in team chat). CI does not build the Docker image yet. | | open |
| 37 | Git workflow | Rulebook: only the reviewer merges; no one merges their own PR. Team must confirm. The ADR PR was merged to main; record who approved and who merged it. | | open |
| 38 | ADR list | Written in docs/adr/: 0001 to 0006 existing, 0007 to 0012 proposed. See docs/adr/README.md. | | in progress |
| 39 | README contents | Required sections per spec | | open |

## Ownership

| # | Decision | Options / notes | Owner | Status |
|---|---|---|---|---|
| 40 | Owner per mandatory area | One named person and a deadline per item, before 1 December | | open |