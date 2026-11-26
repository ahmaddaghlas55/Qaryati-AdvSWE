# Qaryati — Standalone AI Agent Handoff: Ahmad (dug)

**Assigned engineer:** Ahmad (dug)  
**Independent work package:** A — Public API, Consistency & Architecture  
**Authority:** Qaryati project overview, team decisions register and task-plan snapshot supplied by the user. This file is a **self-contained agent instruction brief**: no need to read another teammate's brief to start. When actual repository/specification conflicts, inspect and report the discrepancy.  
**Completion type:** code + tests + documentation + PR-ready handoff; no merge or dependent integration needed to finish this package.  

## Agent operating instructions — READ FIRST

You are an engineering AI working on the **existing Qaryati backend repository**. Your assignment is to deliver **one independent, tested feature package** on your teammate's branch. **Do not rebuild or replace the project.** The overview below was supplied as a repository snapshot, but you **must inspect the actual checked-out files** before modifying anything: this packet is not live source code. If the repository differs, preserve the live implementation, document differences, and avoid guessing.

**Your first actions (in this order):**
1. Check Git status/branch, repo instructions and course rulebook if available, `README.md`, `qaryati-starter-guide.md`, `docs/project-overview.md`, and relevant `tasks/` specs. Never overwrite teammates' uncommitted changes.
2. Trace the modules you own, check `prisma/schema.prisma` if relevant, and run the existing baseline commands `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Record actual pass/fail, do not invent a result.
3. Classify every subtask **Already implemented / Partially implemented / Missing / Requires integration**. Work only on tasks you can complete in your own branch without another agent's changes.
4. Implement minimally, using existing styles and dependencies. Add focused tests and run checks. Produce a PR-ready handoff even if integration has not yet happened.
5. If a requested detail is not defined by the actual course specification or existing schema, propose a documented contract and mark it **PROPOSED**; do not claim it was agreed or secretly invent required fields/endpoints. Avoid unnecessary clarification when you can complete the independent portion with a clean interface.

**Never do these without explicit coordination:** modify another teammate's owned module; merge branches; rewrite existing public API contracts; add a frontend, Redis, microservices, or a second backend; replace the Prisma migration history; hit public Nominatim in automated tests; write real secrets into Git; declare an unimplemented feature complete. Changes to shared `src/app.ts`, `src/container.ts`, or `src/server.ts` are integration tasks unless explicitly delegated.

**Implementation conventions:** one modular-monolith Node.js 22 / strict TypeScript / Express 5 API; PostgreSQL + Prisma; controllers validate input with Zod and handle HTTP; services hold use-case rules and depend on repository interfaces; Prisma-specific types and queries stay in persistence adapters; Pino logging and request IDs; versioned API under `/api/v1/`; success `{data}` or list `{data, meta}`; errors with `code`, `message`, `details`, `requestId`, `timestamp`; pagination defaults `page=1`, `pageSize=20`, max `pageSize=100`. Preserve existing in-memory LRU instead of adding Redis.

**Decision versus delivery:** The team agreed the 40 decisions. The prior **28–30 November 2026 dates were decision deadlines**, NOT development completion deadlines. Do not assume completion just because a decision is labeled Agreed. Set actual implementation due dates with the project manager.

## Current repository baseline (source snapshot supplied by user)

Qaryati is an **API-only** service for sourced information about Palestinian villages; there is **no frontend** in this repository. The intent is trusted, attributable facts with statuses, review and audit trails, but the shipped API is primarily public read-only. It uses one modular monolith with a layered module boundary.

**Application entry and shared pieces:**
- `src/server.ts`: HTTP listen and shutdown; `src/app.ts`: middleware, health/ready and routers; `src/container.ts`: dependency wiring.
- `src/config/`: parses `process.env` through Zod into an immutable config (still inspect actual call).
- `src/shared/cache/`: Cache interface, in-memory LRU (500-entry capacity in overview), fake cache; created in container but not consumed by public services.
- `src/shared/db/`: Prisma client and `UnitOfWork` using Prisma `$transaction` (helper present, read code not using it).
- `src/shared/errors/`, `src/shared/http/`, `src/shared/logging/`, `src/shared/time/`: errors, request-ID middleware, Pino request context, clock abstraction.
- `prisma/schema.prisma`, `prisma/migrations/`: models and migrations; `seed/` sample SQL; `test/integration/` and `test/load/` currently placeholders; `docs/adr/` for ADRs.
- PostgreSQL-backed `GET /ready` and process `GET /health`; requests use `X-Request-Id` and AsyncLocalStorage correlation when supported.

**Existing HTTP endpoints (do not reimplement):**
```text
GET /api/v1/governorates
GET /api/v1/governorates/:slug
GET /api/v1/governorates/:slug/villages
GET /api/v1/villages
GET /api/v1/villages/:slug
GET /api/v1/villages/:slug/names
GET /api/v1/villages/:slug/names/history
GET /api/v1/sources
GET /api/v1/sources/:id
```
- Village public listing/details: verified and not soft deleted; historical-name history: verified or superseded and not deleted; current names: verified official current names. Governorate-scoped village list: unknown governorate → 404; known governorate without matching villages → 200 and empty page. Sources do not currently have moderation status or `deletedAt`, and their current read list is sorted by title then ID.
- Existing `AppUser` and `RefreshToken` Prisma models support future auth; `AuditLog` table and DB-level append-only trigger exist. No app-level audit writes on actual mutations yet. `Village`/`VillageName` have review/status/supersedes/deletion fields. **Population and Historical Event models/modules are not present in the supplied snapshot.**
- Jasmine unit tests with fake repositories exist. Supertest is installed but no actual integration tests exist in the snapshot. Docker Compose and some CI already exist (verify them rather than rewriting).

**Currently NOT shipped** in the supplied snapshot: auth/login/refresh endpoints or role middleware; user admin management; village/name/source writes; approval/rejection workflow; application-layer audit writes; population/events/history/heritage/economy modules; geocoding integration; active inbound rate limiting; active LRU-backed service caching; genuine database integration/k6 tests. Paths or env variables for these features are **not evidence they run**.

**Developer commands:**
```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
npm run test:integration
npm run dev
npm run db:migrate
npm run db:seed
# Local Compose entrypoint, verify the files first:
docker compose up --build
# Migrations in Docker, per project overview:
docker compose run --rm api npx prisma migrate deploy
```
Current overview states Compose exposes PostgreSQL at host port **5434**, app at **3000**. Inspect current `.env.example` and Compose before running. **Never point migration/reset/test commands to production or a teammate's database.**

## Team contracts and non-negotiable business rules

- Roles: unauthenticated **Public**, authenticated **Contributor**, **Verifier**, **Admin**.
- Public can read published records. Contributors/Verifiers/Admins may submit proposals and edit **their own pending** proposals. Verifier/Admin may approve/reject **others'** manual-review proposals, and may both soft-delete and restore. Only Admin may manage user roles. No one may self-approve their submitted proposal, including an Admin.
- **Manual review** for Villages, Historical Names, Population, Historical Events. **Automatic publication after validation** for Source metadata; source publication does not verify claims based on that source.
- Rejection reason is mandatory; approval note optional; rejected proposals preserved and revisions become new proposals. Keep superseded history and avoid physical deletion where soft deletion applies.
- Reject negative population and future years; retain multiple same-village/year records when backed by **different sources**; preserve conflicting claims with explicit conflict flags. Do not assume a unique constraint on `(village, year)`.
- Audit changes with actor, action, entity, old/new state, time and request ID. Business mutation and audit insertion must be in **one database transaction**; audit records are append-only.
- Geocoding: Nominatim, suitable identifying user agent, 4-second timeout, **no user-facing auto retries**, graceful missing-coordinate fallback, at most **one outbound request per second per running app instance** and coordinate across instances if deployed with multiple replicas. Cache only successful results for **24 hours** in existing LRU; no negative/error caching. Existing generic `CACHE_TTL_SECONDS=300` is a different TTL.
- Security: bcrypt; JWT access 15 minutes / refresh 7 days; CORS allowlist per environment; inbound limits general 100/minute/IP and auth 10/minute/IP; local `.env` not committed, only safe `.env.example` placeholders.
- API defaults: village `slug ASC`, optional `slug ASC/DESC` or `updatedAt ASC/DESC`; use `slug ASC` as secondary ordering on timestamp ties. Source list title then ID. Don't invent sort rules for other endpoints without checking code.
- Documentation: maintain Postman workflow and produce actual valid `docs/api/openapi.yaml`; three selected ADRs — Monolithic Layered Architecture, Public Historical Name Visibility, In-Memory LRU Caching in `docs/adr/`; preserve README and add only course-required missing sections, including ADR and unit/integration/k6 references.

## Team boundaries and dependency contract

| Partner | Main independent scope | Must defer until integration |
|---|---|---|
| Ahmad (dug) | Existing public read API, sorting, API contracts, config/architecture | Wiring new auth, new write routes, geocoding, caching invalidation |
| Maher (meho) | Self-contained authentication, actor/policy module and security middleware | Mounting into root app, enforcing policy in Hosni writes |
| Hosni (Hos) | New data/schema/services/repositories, audit, review and geocoder adapter | Real JWT identity integration, mounting public/write endpoints, injecting geocoder into village detail |
| Mahmood (Mah) | Tests for *existing public API*, CI, Docker, ADRs, README | Cross-feature tests and final release after others merge |

Agree or record a small type contract (`AuthActor`, ID types, statuses, error DTOs) before integration; independent services can use fakes/stubs. If the spec doesn't give an exact type, confirm current Prisma shapes first. **Do not import another agent's unmerged feature.**


---

## YOUR FULL ASSIGNED INDEPENDENT WORK PACKAGE

# PACKAGE A — Ahmad (dug): Public API, Consistency & Architecture

**Goal:** Deliver a stable, documented, fully tested public read API using existing implemented modules. Entire package must run against current schema and seeded sample data, without waiting for authentication or planned write modules.

**Owned files/directories (principal):** `src/modules/governorates/` existing read code, `src/modules/villages/` existing read code, existing `src/modules/sources/` read endpoints when changes concern contracts, `src/config/` for config checks, related colocated specs, API docs under `docs/api/` (coordinate documentation-only ownership with Mahmood). **Do not touch:** auth module, future write-module internals, population/event models, security-module internals.

### A1. Audit public endpoints
- Run the application and test each of the nine existing public routes listed above; record HTTP status, JSON shape, validation, filter, pagination, and empty-result behavior.
- Keep published village filtering: only `verified`, not soft-deleted. Keep history filtering: `verified` and `superseded`, not soft-deleted.
- Confirm governorate scoped village list distinguishes unknown governorate (404) from valid governorate with no records (200 + empty data).
- Confirm source list sorting by title then ID, and review other implemented endpoints' current defaults before proposing changes.

### A2. Finalize stable sorting (#32)
- Preserve village list defaults `sort=slug`, `order=asc`; keep allowed `slug|updatedAt` and `asc|desc`.
- Add `v.slug ASC` as secondary tie-breaker **only** for `updatedAt ASC/DESC` in the existing repository `orderBy` builder.
- Verify `/governorates/:slug/villages` has equivalent deterministic ordering. Coordinate changes only to its read module.
- Add tests demonstrating equal-timestamp tie behavior and default sorting. Note that offset-based pagination can still shift if records are concurrently inserted or updated; the tie-breaker ensures deterministic ordering for a fixed dataset, not transactionally frozen pages.

### A3. Validate configuration and API consistency
- Confirm `src/config` actually calls `envSchema.parse(process.env)` (or equivalent) before accepting requests and that code reads the exported config rather than calling `process.env` everywhere.
- Review error schema `code`, `message`, `details`, `requestId`, `timestamp`; check validation error codes and 404 handling.
- Confirm default page=1, pageSize=20, max=100 for list endpoints; review any divergence rather than silently altering stable API contracts.
- Verify logger includes request IDs and secrets are redacted; raise issues for Maher instead of modifying his security work.
- Check response fields and field selection to avoid accidentally exposing private/reviewer fields; avoid unnecessary DTO refactoring where public results are already correctly shaped.

### A4. API contract and handoff documentation
- Produce `docs/api/current-public-api.md` or equivalent documenting **existing** routes with sample queries/responses and known validation errors.
- Maintain true OpenAPI 3.x YAML in `docs/api/openapi.yaml` for existing public endpoints. Postman collection may be supplied too, but a renamed Postman JSON export is not OpenAPI YAML.
- Record proposed (not shipped) future endpoints in a separate file or section, never as implemented.

### A5. Quality & acceptance
- `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` succeed.
- Every implemented public route is tested for success and representative invalid/not-found cases.
- Default sorting remains unchanged; timestamp tie-breaker is deterministic.
- No new dependency on Maher's auth code, Hosni's new models, or Mahmood's new test harness.
- Deliver PR `feature/public-api-hardening`, a public API inventory, tests, and OpenAPI docs.

**Independent completion condition:** Entire package is complete using only the current seeded database and existing code. Future population/event APIs and authenticated writes are intentionally excluded.

---

---

## Agent-specific execution sequence and implementation guidance

**Your repository authority:** `src/modules/governorates/`, existing *read paths* of `src/modules/villages/` and `src/modules/sources/`, `src/config/` checks and `docs/api/` authoritative contracts. Ask before editing other members' new code or changing shared bootstrap/wiring. You own the read surface, not Hosni's pending write services.

**Do these in priority order:**
1. **Inventory the 9 shipped endpoints** and walk route → controller → service → repository → SQL. Capture precise existing defaults in `docs/api/current-public-api.md`. Test 200/400/404 and empty pages. Enforce verified/not-deleted village visibility and approved name-history visibility; don't accidentally expose reviewer metadata.
2. **Apply decision #32 minimally:** in `villages.prisma-repository.ts`, change both `updatedAt` branches to `v.updated_at ASC, v.slug ASC` and `v.updated_at DESC, v.slug ASC` respectively. Preserve `slug ASC` default and `slug DESC` option; don't interpolate raw client sorting strings. For scoped governorate villages, inspect before altering and add a deterministic tie-breaker only if necessary.
3. **Test sorting:** fixture with equal `updated_at` values, both timestamp directions, default slug direction, page boundaries. Remember tie-breakers do not freeze data across concurrent updates; describe exact guarantee honestly.
4. **Config audit:** prove the startup execution path parses Zod environment config, including invalid secret and invalid port cases. If startup is already correct, do not change it. Verify Node 22 compatibility with current scripts/CI, not by broad upgrade.
5. **Contract consistency:** verify existing page/pageSize defaults, response and errors (`code/message/details/requestId/timestamp`), request ID propagation, Pino redaction and safe DB field mapping. Fix only regressions evidenced by tests.
6. **API docs:** write accurate OpenAPI 3.x YAML under `docs/api/openapi.yaml` covering **currently exposed** endpoints. Validate YAML and OpenAPI schema with available tooling, without inventing auth routes. The Postman collection is a separate compatible artifact, not a `.yaml` rename. Future routes may be listed separately as PROPOSED.

**Test matrix:** every one of the nine endpoints; invalid governorate slug, invalid pagination, unknown village vs existing village with zero names, source list filtering, status/soft-deletion visibility, timestamp tie tests, no sensitive reviewer fields in output, deterministic sample responses. Use existing unit test system; coordinate with Mahmood on integration tests instead of modifying his harness.

**Acceptance proof:** document actual failing/passing commands; minimal diff; endpoint inventory; documented sample requests/responses; only requested read-related code changed. **PR name:** `feature/public-api-hardening`.

**Common pitfalls:** `v.updated_at` refers to SQL snake_case, while query parameter is `updatedAt`; never break `Prisma.sql` parameter safety. Governorate has no `updatedAt` by design. Service shapes responses; repository handles DB type conversion. Missing governorate and empty result are different.


---

## Relevant agreed team decisions (source register excerpts)

#### #1 — Node.js version
- **Decision:** Use **Node.js 22**; preserve the existing Dockerfile version.
- **Rationale:** Match the currently selected runtime and avoid unnecessary version changes.
- **Owner / deadline:** Ahmad (dug) — 28 Nov 2026.
- **Status:** **Agreed — review needed.** The team's rulebook previously mentioned Node.js 20; verify or update that documentation consistently and ensure the course imposes no conflicting requirement.

#### #4 — Logging
- **Decision:** Use **Pino**, structured JSON logs and correlation/request IDs.
- **Rationale:** Enable traceable diagnostics across requests without adding a separate logging stack.
- **Owner / deadline:** Ahmad (dug) — 28 Nov 2026.
- **Status:** **Agreed; implementation to verify.**

#### #5 — Caching strategy
- **Decision:** Keep **in-memory LRU caching**; do not introduce Redis for the agreed scope.
- **Rationale:** The current project does not require the additional infrastructure of a distributed cache.
- **Owner / deadline:** Ahmad (dug) for general stack choice; coordinate with Hosni (Hos) for geocoding cache — 28 Nov 2026.
- **Status:** **Agreed — review needed.** See #25 for the distinct geocoding TTL and ADR-003.

#### #6 — Environment configuration
- **Decision:** Retain the existing **`.env`** configuration and centralized **Zod `envSchema` validation in `src/config/`**. Preserve current variables; no unnecessary refactoring.
- **Rationale:** An existing typed Zod schema already lists required variables and checks many values.
- **Owner / deadline:** Ahmad (dug) — 28 Nov 2026.
- **Status:** **Agreed — review needed.** Confirm `envSchema.parse(process.env)` or equivalent actually runs at application startup. Only consider small correctness fixes if needed.

#### #7 — System architecture
- **Decision:** Maintain the existing **monolithic layered architecture**.
- **Rationale:** Fits the course project and protects the working codebase from an unnecessary architectural rewrite.
- **Owner / deadline:** Ahmad (dug) — 28 Nov 2026.
- **Status:** **Agreed — review needed.** Explain the choice and alternatives in ADR-001; do not refactor solely to change labels.

#### #8 — Shared code placement
- **Decision:** Keep reusable infrastructure in **`src/shared/`** and feature-specific logic inside its feature modules.
- **Rationale:** Preserve current boundaries and minimize duplication.
- **Owner / deadline:** Ahmad (dug) — 28 Nov 2026.
- **Status:** **Agreed.** In the reviewed structure, `app.ts`, `container.ts`, and `server.ts` live directly under `src/`, not `src/shared/`.

#### #10 — DTO mapping and response shaping
- **Decision:** Continue **service-level response shaping**, preserving the current controller/service separation.
- **Rationale:** Existing services already assemble API response structures; avoid duplicating transformation layers.
- **Owner / deadline:** Ahmad (dug) — 28 Nov 2026.
- **Status:** **Agreed — review needed.** Village list service shapes pagination metadata, but repository field selection and all response exposure should be checked.

#### #29 — API versioning
- **Decision:** Use the **`/api/v1/`** prefix for API routes.
- **Rationale:** Keep a stable, explicit initial API version.
- **Owner / deadline:** Ahmad (dug) — 29 Nov 2026.
- **Status:** **Agreed; implementation to verify across routes.**

#### #30 — Error response format
- **Decision:** Use the existing five-field API error shape: **`code`, `message`, `details`, `requestId`, `timestamp`**.
- **Rationale:** Consistent machine-readable errors and diagnostics.
- **Owner / deadline:** Ahmad (dug) — 29 Nov 2026.
- **Status:** **Agreed; implementation to verify across endpoints.**

#### #31 — Pagination defaults
- **Decision:** Default **`page=1`**, **`pageSize=20`**, max **`pageSize=100`**.
- **Rationale:** Bound response sizes while providing usable defaults.
- **Owner / deadline:** Ahmad (dug) — 29 Nov 2026.
- **Status:** **Agreed.** These constraints were seen in `villageListQuerySchema`; verify other paginated endpoints separately.

#### #32 — Default sort orders
- **Decision:** For village listing, default to **`slug ASC`**. Support `slug ASC/DESC` and `updatedAt ASC/DESC`; when ordering by `updatedAt`, add **`slug ASC`** as a deterministic secondary key for equal timestamps.
- **Rationale:** Preserve existing API behavior while stabilizing pagination when timestamps tie.
- **Owner / deadline:** Ahmad (dug) — 29 Nov 2026.
- **Status:** **Agreed — minimal change pending.** Existing query schema and repository sorting were reviewed; apply only the tie-breaker in the two timestamp branches, and review defaults for other collections independently.

#### #33 — API documentation
- **Decision:** Maintain **Postman** as the team's API workflow and deliver API documentation at **`docs/api/openapi.yaml`** as planned.
- **Rationale:** Make endpoints easy to exercise and provide shareable API documentation.
- **Owner / deadline:** Ahmad (dug) — 29 Nov 2026, with Mahmood (Mah) for documentation delivery.
- **Status:** **Agreed — review needed.** A Postman collection export is not automatically a valid OpenAPI YAML file; ensure the required output is actually generated and validated.

---

## Integration-only backlog — NOT part of your independent completion gate

These are separately scheduled and do not block this handoff. Only work on an integration ticket once the required branches/contracts are available:

| ID | Task | Primary lead | Dependencies |
|---|---|---|---|
| INT-01 | Mount auth routes, bearer middleware and inbound rate limiters in root app | Maher; Ahmad reviews wiring | Maher's package and existing root app |
| INT-02 | Expose write/review HTTP endpoints and connect Maher's policies to Hosni services | Hosni; Maher approves policy binding | Maher's policy contract + Hosni's services |
| INT-03 | Expose population/events read APIs and document their contract | Hosni; Ahmad reviews endpoint conventions | Hosni's models/services |
| INT-04 | Add geocoding enrichment to existing village detail without breaking DTO/fallback | Hosni; Ahmad coordinates read code | Hosni's adapter + Ahmad's existing village module |
| INT-05 | Add safe LRU service caching and invalidation for source-backed public data | Ahmad with Hosni | Read services + mutation/invalidation contract |
| INT-06 | End-to-end security/write/verification integration tests | Mahmood | Relevant integration branches merged |
| INT-07 | Final API docs, full CI/Compose checks and release verification | Mahmood coordinates all | Integration complete |

**Important:** Don't fabricate completed work, measurements, or outputs for any integration ticket.


## Mandatory handoff / final agent response

When you finish, return a concise but complete **implementation report** in the format below. Include actual file paths, commands, results, and anything blocking future integration. Do not give a vague "done" response or say tests passed unless you ran them.

```markdown
# Ahmad (dug) — Implementation Handoff
## 1. Baseline observed (branch, code and commands)
## 2. Already implemented / partially implemented / missing (before work)
## 3. Changes made (files and behavior)
## 4. Tests added and actual command results
## 5. Security/data contract assumptions and unresolved specification gaps
## 6. Interfaces/exports another teammate can call (with exact signatures)
## 7. Deferred integration tickets and dependencies (INT-xx)
## 8. PR-ready summary and migration/setup steps
## 9. Remaining risks or items not completed
```

**Success criterion:** Your independent scope works against **current existing project** and own test doubles/isolated DB without waiting on another teammate's unfinished work; shared wiring is reserved for integration. Never claim the entire Qaryati system is finished based on this package alone.
