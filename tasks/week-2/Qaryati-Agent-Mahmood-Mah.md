# Qaryati — Standalone AI Agent Handoff: Mahmood (Mah)

**Assigned engineer:** Mahmood (Mah)  
**Independent work package:** D — Testing, Delivery & Documentation Platform  
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

# PACKAGE D — Mahmood (Mah): Testing, Delivery & Documentation Platform

**Goal:** Build a reliable test/deployment/documentation system around the **already working public API**. Do not wait for authentication or write modules to exist.

**Owned files/directories (principal):** `test/integration/`, `test/load/`, test helpers, GitHub CI configuration, `Dockerfile`/`docker-compose.yml` if fixes needed, `README.md` (add missing content only), three selected ADR Markdown files in `docs/adr/`. Avoid editing application domain logic.

### D1. Integration-test infrastructure
- Create a safely isolated **test PostgreSQL database** configuration, migrations and seed fixtures; never run truncation/reset against developer or production DB.
- Build Supertest tests for existing public routes: governorates, scoped villages, village detail, current names, historical names, and sources.
- Cover success, non-existent records, visibility, soft-deletion filtering, source listing, validation failures, error shape, default pagination, maximum page size and sorting.
- Ensure tests are repeatable, order-independent and runnable with `npm run test:integration`.
- Keep future auth/write integration scenarios as **separate later tickets**; do not block this package on them.

### D2. k6 performance tests against working endpoints
- Build reproducible `test/load/` scripts for existing public village list/detail/filter paths.
- Target **50 virtual users over 5 minutes**, p95 response time **under 500 ms**, HTTP failure rate **under 1%** under a documented environment/dataset.
- Start with baseline, identify a measured bottleneck, optimize only after observing evidence, then compare before/after. Coordinate any service changes in a new owner-approved task.
- Avoid hitting public Nominatim in load tests.
- Document assumptions: test machine, data size, warm-up, DB condition, and failure exclusions.

### D3. Docker and CI
- Verify `docker compose up --build` starts API and PostgreSQL; document migrations (`docker compose run --rm api npx prisma migrate deploy`) and local environment settings.
- Verify CI installs dependencies, lints, typechecks, migrates test DB, runs unit and integration tests, and builds a Docker image as agreed. If existing CI works, keep it.
- Handle `.env.example` only with placeholders; no secrets in images, commits, or workflow logs.
- Verify the rulebook permits the agreed merge policy. Do not change Git workflow without checking that requirement.

### D4. ADRs and README
- Produce exactly the selected ADR topics: **Monolithic Layered Architecture**, **Public Historical Name Visibility**, and **In-Memory LRU Caching**, stored in `docs/adr/`. Use the repo's existing ADR numbering/naming conventions if established to avoid conflicts.
- Each ADR should include Context, Decision, Alternatives, Consequences, Status/Date and links to related decisions.
- Preserve existing README and add only missing sections required by the **actual course specification**, including links to the three ADRs, setup, unit/integration/k6 instructions and honest current-state notes.
- Coordinate API documentation: Ahmad owns authoritative endpoint descriptions and OpenAPI; Mahmood links to them rather than writing conflicting duplicate API contracts.

### D5. Tests & acceptance
- A clean checkout can follow documented instructions and run lint, typecheck, unit, integration, build and Docker startup.
- Integration tests test genuine SQL behavior against isolated PostgreSQL.
- k6 tests are reproducible and report thresholds, not invented pass results.
- ADRs and README reflect actual agreed decisions without claiming planned features shipped.
- Deliver PR `feature/quality-delivery-docs`, test procedures and CI evidence.

**Independent completion condition:** Infrastructure, tests and documentation cover the existing public system and run without any of the other three new-feature branches.

---

---

## Agent-specific execution sequence and implementation guidance

**Your repository authority:** `test/integration/`, `test/load/`, related test helpers, CI config, `Dockerfile` and Compose as needed, existing `README.md`, `docs/adr/`. Ahmad owns the canonical API contracts (`docs/api/`); link to those rather than editing them yourself. Avoid application-domain code changes.

**Do these in priority order:**
1. **Inventory current test/CI/Compose setup:** inspect `package.json` and test runners, `test/integration/`, `test/load/`, workflow files, Dockerfile/Compose/`.env.example`. Record actual working commands; current overview says Jasmine + fake repo tests exist, Supertest installed, DB integration/load tests absent.
2. **Isolated real-Postgres integration harness:** separate test DATABASE_URL, safe migrations/setup and deterministic fixtures. Add a guard refusing any destructive reset outside clearly recognized isolated test DB. The audit table has an append-only trigger, so use safe fixture cleanup (unique fixture identities, test DB recreation/migration where appropriate), not unguarded TRUNCATE of `audit_log`. Cover *existing* public routes (9), Zod validation, requestId/error shape, name history public visibility, source listings, governorate scoped 404/empty distinctions, pagination and sorting. Tests must be repeatable and independent of test order.
3. **k6 scripts targeting only current routes:** village list/detail/filter, 50 VUs for five minutes, p95 < 500ms and http_req_failed < 1%; use selected dataset and a documented load host/DB profile. Report baseline and measured results, optimize one observed bottleneck only by raising an issue for the corresponding owner, rerun and compare. Do not fabricate a performance pass or call public Nominatim during load tests.
4. **Docker+CI:** verify `docker compose up --build` runs API+DB and migrations; avoid changing Compose if already correct. CI should lint, typecheck, migrate isolated DB, unit+integration test, audit per current policies, build app and automatically build Docker image. Verify actual Node 22 vs previous rulebook Node 20 language, handle course restrictions, no secrets in logs/artifacts. CI should not need credentials that are unavailable in PR execution; use safe placeholders/test secrets.
5. **Exactly three ADR topics** in `docs/adr/`: Monolithic Layered Architecture; Public Historical Name Visibility (show verified/superseded, hide proposed/rejected/deleted); In-Memory LRU Caching (no Redis, service use still pending). Check folder for any existing ADR versions, update existing rather than duplicating. Each ADR: title, context, considered alternatives, decision, consequences, trade-offs, status/date; don't assert DB-port changes as an ADR.
6. **README minimal update**: preserve current document, add only missing course-required sections after reading actual rulebook; link three ADRs, setup/test commands, unit/integration/k6 workflow, Docker, current implementation limitations, and Ahmad's API docs. Confirm rulebook permits any member merging before documenting Git permissions as final.

**Acceptance proof:** isolated DB integration suite passes, k6 suite with reproducible command and honest measured output, clean machine startup documented, CI Docker image build, three ADRs present/linked, README preserved and updated minimally. **PR name:** `feature/quality-delivery-docs`.

**Common pitfalls:** load targets are performance *goals* not verified outcomes; never hit real provider through load tests; avoid duplicating Ahmad's OpenAPI docs; avoid end-to-end tests of future auth/write routes until INT-06.


---

## Relevant agreed team decisions (source register excerpts)

#### #34 — Test strategy
- **Decision:** Use **unit tests with fake repositories** and **integration tests with a real isolated test database**.
- **Rationale:** Keep business-logic tests fast while verifying realistic persistence behavior.
- **Owner / deadline:** Mahmood (Mah) — 30 Nov 2026.
- **Status:** **Agreed — review needed.** Preserve any current test setup; inspect actual coverage and database isolation.

#### #35 — Performance tests
- **Decision:** Use **k6**, with **50 virtual users for 5 minutes**, target **p95 response time < 500 ms** and **HTTP failure rate < 1%** on public village listing/detail/filter scenarios. Capture a baseline, optimize one measured bottleneck, then compare results.
- **Rationale:** Establish measurable performance targets and evidence of improvement.
- **Owner / deadline:** Mahmood (Mah) — 30 Nov 2026.
- **Status:** **Agreed; execution and measured results pending.** Avoid generating live public Nominatim traffic during load tests.

#### #36 — Docker delivery
- **Decision:** Keep **Docker Compose one-command startup** via `docker compose up --build`; build the Docker image automatically in CI.
- **Rationale:** Provide a reproducible way to start the application and verify buildability.
- **Owner / deadline:** Mahmood (Mah) — 30 Nov 2026.
- **Status:** **Agreed — review needed.** Confirm local Compose startup and CI pipeline behavior.

#### #37 — Git workflow
- **Decision:** Keep the **existing course rulebook Git workflow**; under the team's chosen practice, **any team member may merge**.
- **Rationale:** Avoid imposing a new branching/review model on the current team.
- **Owner / deadline:** Mahmood (Mah) — 30 Nov 2026.
- **Status:** **Agreed — review needed.** Verify the exact rulebook actually permits the chosen merge practice; adjust only if required by the course.

#### #38 — Architecture Decision Records (ADRs)
- **Decision:** Write three ADR files in **`docs/adr/`**:
  1. **ADR-001 — Monolithic Layered Architecture** (#7)
  2. **ADR-002 — Public Historical Name Visibility** (#15)
  3. **ADR-003 — In-Memory LRU Caching** (#5)
- **Rationale:** Document meaningful technical tradeoffs and their consequences.
- **Owner / deadline:** Mahmood (Mah), with contributions from the affected owners — 30 Nov 2026.
- **Status:** **Agreed; ADR files still need to be created/verified.** These titles and filenames are organizational suggestions; the required ADR topics and directory are agreed.

#### #39 — README contents
- **Decision:** **Preserve the existing README** and add **only missing sections required by the course specification**. Include links to all three ADRs and instructions for **unit, integration and k6 performance tests**.
- **Rationale:** Meet documentation requirements while retaining existing work.
- **Owner / deadline:** Mahmood (Mah) — 30 Nov 2026.
- **Status:** **Agreed — review needed.** Compare README against the actual course specification before editing; do not invent mandatory headings.

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
# Mahmood (Mah) — Implementation Handoff
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
