# Qaryati — Standalone AI Agent Handoff: Hosni (Hos)

**Assigned engineer:** Hosni (Hos)  
**Independent work package:** C — Source-Aware Data Write and Historical Review Engine  
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

# PACKAGE C — Hosni (Hos): Source-Aware Data Write and Historical Review Engine

**Goal:** Build the domain/data foundation for records and editorial workflow, while exposing business use cases that can be tested with fake actor identities; do **not** depend on Maher's actual JWT system or Ahmad's routes.

**Owned files/directories (principal):** `prisma/schema.prisma`, **new migrations** under `prisma/migrations/`, new write/review modules such as `src/modules/submissions/`, `src/modules/population/`, `src/modules/events/`, associated repositories/services/tests; `src/integrations/geocoding/` and its cache adapter. Existing village/name/source public read modules are Ahmad's area; avoid editing them until integration.

### C1. Audit data model and migrations
- Verify existing Governorate, Village, VillageName, Source, AppUser, RefreshToken, AuditLog and soft-deletion/versioning fields.
- Design Population and Historical Event models **only to the degree required by the course/domain guide**, with source associations, creator/reviewer metadata, review status, soft deletion where appropriate and safe migrations.
- Population validation: nonnegative values; no future year; permit multiple same village/year records **when their sources differ**; preserve conflicting information and flag it rather than overwriting it.
- Historical names must retain superseded history and not expose proposed/rejected/deleted records publicly.
- Avoid changing Governorate just to add `updatedAt` (explicitly decided not to).
- Review query-driven indexes; include necessary foreign keys and relevant lookup/status indexes, without adding speculative indexes.

### C2. Generic domain use cases, no HTTP/auth dependency
- Build standalone commands/services for proposing village and historical-name changes, population entries and historical events; reject or approve, and mark superseded when appropriate.
- For manually reviewed types, a new contribution remains pending until a different Verifier/Admin reviews it. Reject requires a note and keeps the proposal; revised contributions are separate proposals.
- Build source creation service that validates bibliographic metadata and publishes valid sources immediately; acceptance of metadata does **not** verify claims backed by the source.
- For remove/restore, retain original records through soft deletion; policy permission is checked using an injected plain `AuthActor`/authorization port, not an import from Maher's not-yet-merged module.
- Protect against accidental concurrent approval/status transitions using transactional re-checks or optimistic constraints where appropriate.

### C3. Transactional audit and integrity
- Preserve existing append-only `audit_log` database trigger.
- For every meaningful domain mutation, write old/new snapshot, actor, entity/action, timestamp and request ID within the **same Prisma transaction** as the data change.
- Verify rollback if audit insertion fails. Never mutate an existing audit row.
- Define repository interfaces for domain logic and Prisma repository implementations; keep Prisma types inside the persistence layer.

### C4. Independent Nominatim geocoding adapter
- Implement geocoding behind an interface rather than coupling it to the public village service.
- Provider: existing public Nominatim configuration with descriptive user-agent; comply with provider usage policy.
- Timeout **4 seconds**; **no automatic retries** for user-facing requests; gracefully return no coordinates on timeout/failure without blocking the village details response when later integrated.
- Throttle outbound requests to at most **1 request per second across the app instance**; guard against simultaneous calls. For multiple deployed instances, rate limiting must be coordinated or use a compliant arrangement.
- Cache only successful geocoding responses for **24 hours**, using the existing in-memory LRU adapter. Don't cache errors, timeouts or no-results. Keep generic cache TTL (300 s in sample `.env`) separate from the geocoding-specific 24-hour TTL.
- Use mocked HTTP and fake clock in tests; never hit public Nominatim during unit tests or load tests.

### C5. Tests & acceptance
- Unit-test population validation, same-year-different-source behavior, conflict flags, review transitions, no self-review, rejected proposals, version history, soft delete/restore, audit rollback, geocoding timeout/rate-limit/cache.
- Repository/migration verification runs against an isolated PostgreSQL test DB; do not assume Mahmood's integration suite is finished.
- Deliver PR `feature/domain-workflows-geocoding`, migrations, tested application services, domain contracts, local setup notes.

**Independent completion condition:** All new use cases work through direct service calls in tests using a fake actor and fake authorization port; no live Maher tokens or new Ahmad endpoints required. Mounting routes and unifying policies occurs separately.

**Scope note:** This is the heaviest domain package. If estimates show it cannot reasonably fit the schedule, split it into sequential Hosni-owned milestones without creating dependencies on other teammates; move the geocoding adapter to its own independently deliverable Hosni ticket.

---

---

## Agent-specific execution sequence and implementation guidance

**Your repository authority:** `prisma/schema.prisma` and *new* migrations, new domain write/review modules and Prisma adapters, `src/modules/population/`, `src/modules/events/`, `src/integrations/geocoding/`, domain-specific unit specs. **The overview does not provide the full Population/Event field requirements** — read the starter guide/course spec before designing them. Avoid editing Ahmad's current public read repositories or Maher's auth module.

**Break the large package into independently executable milestones within your own branch:**
1. **Schema audit and minimal migrations.** Trace current status/relations and versioning for `Village`, `VillageName`, `Source`, `AuditLog`, `AppUser`. Keep migrations additive/safe and never rewrite historical migrations. Add Population/Event only when justified by domain spec; include source reference, review/creator metadata and soft-delete where required. Do not add `Governorate.updatedAt`. Add indexes justified by actual filters. Preserve the `AuditLog` append-only DB trigger.
2. **Source metadata write service:** validate fields, create new Source automatically on success (no review status added solely for this), keep duplicate/uniqueness behavior consistent with schema. The creation of Source does not verify a population figure or historical event it cites. Implement a fake actor + fake repository test harness.
3. **Manually reviewed contribution services:** propose/submit Villages, Historical Names, Population and Events, keep non-public until another Verifier/Admin approves; rejected proposals persist with required reason and revisions submitted separately; approval note optional. Model status transitions and competing reviews safely. Status/supersession semantics must preserve verified public history. Use `AuthActor` shape locally behind a port until Maher's branch is merged.
4. **Population evidence:** reject negative population/year in future, accept different-source observations in same year and village, record explicit conflict flags and preserve all original evidence; do not silently pick winner. Validate source presence and appropriate year semantics against course guide.
5. **Soft-delete and restore:** authorized Verifier/Admin only, retain record and audit effects; no physical delete for record types with agreed soft-deletion. Use explicit creator/editor/reviewer facts in service-level checks, with injectable auth port for independent tests.
6. **Transactional audit:** actual database update plus detailed append-only audit insertion in one `$transaction` or `UnitOfWork` run; capture old/new state + requestId + actor/time/action/entity. Test deliberate audit insertion failure rolls back the data mutation. Never update/delete/truncate audit rows.
7. **Nominatim adapter, independently tested:** 4000ms timeout, one user-facing attempt, fallback with missing coordinates, 1 outbound request/s per process even under concurrent calls; 24h TTL only for *successful* responses, no error/timeout/no-result caching, reuse LRU 500-entry abstraction. Keep existing general 300s cache config intact. Compliance with public Nominatim policies including accepted usage rate, descriptive contact user-agent and client restrictions must be checked; multi-process deployments need shared throttling or an alternative service arrangement.
8. **Isolated DB checks:** run new migrations and focused repository tests against safe dedicated database; do not depend on Mahmood's future integration framework. Existing verified read behavior must be unaffected by migration.

**Acceptance proof:** domain services callable directly with fake actor/auth port and repositories; deterministic mutation/audit tests including rollback; Nominatim adapter with fake HTTP/time; migration command/output; no root mounting or external JWT imports. **PR name:** `feature/domain-workflows-geocoding`.

**Common pitfalls:** Hosni's workload is large; partition it into issues/milestones without relying on teammates. Do not create an unrestricted 'approve myself' Admin exception. Keep status and soft delete separate. New schema must remain compatible with existing data; never use production DB for migrations/tests.


---

## Relevant agreed team decisions (source register excerpts)

#### #9 — Database transactions
- **Decision:** Preserve the Prisma **`UnitOfWork`** using `$transaction`; require an atomic transaction for logically linked multi-step writes.
- **Rationale:** Related state changes should either all succeed or all fail.
- **Owner / deadline:** Hosni (Hos) — 29 Nov 2026.
- **Status:** **Agreed — review needed.** The `UnitOfWork.run()` wrapper has been seen; inspect actual use in write paths.

#### #13 — Hybrid verification workflow
- **Decision:** **Manual review** for Villages, Historical Names, Population Records and Historical Events. **Automatic publication after validation** for Sources.
- **Review rules:** Verifiers cannot approve their own proposals; rejection reason required; approval note optional; rejected proposals retained; revisions submitted separately as new proposals. Auto-publishing Source metadata does **not** approve any historical claims based on that Source.
- **Rationale:** Preserve review for substantive historical claims while avoiding review overhead for basic source metadata.
- **Owner / deadline:** Maher (meho), coordinating with Hosni (Hos) — 29 Nov 2026.
- **Status:** **Agreed; implementation to verify.** Village/VillageName review fields were present in the shared schema. Population and Event models were not present in the schema previously shared, and must not be assumed implemented.

#### #14 — Removal and restoration
- **Decision:** **Soft deletion only**; both **Verifier and Admin** may remove and restore records.
- **Rationale:** Preserve historical records and traceability while hiding removed data from normal public views.
- **Owner / deadline:** Maher (meho), with Hosni (Hos) for persistence — 29 Nov 2026.
- **Status:** **Agreed; implementation to verify.** This supersedes any earlier admin-only removal proposal.

#### #15 — Public historical-name visibility
- **Decision:** Show only names with **`verified` or `superseded`** status, excluding soft-deleted names. Hide proposed and rejected names from public access.
- **Rationale:** Let the public see authenticated current and former names without surfacing unreviewed claims.
- **Owner / deadline:** Hosni (Hos) — 29 Nov 2026.
- **Status:** **Agreed — review needed.** An earlier public village query filtered joined names to `verified`, current and official; historical-name endpoints must implement the agreed visibility independently. Document rationale in ADR-002.

#### #16 — Population validation
- **Decision:** Reject **negative population**, reject **future years**, and allow multiple records for the same village/year when they represent **different sources**.
- **Rationale:** Preserve valid source-based alternatives without silently collapsing historical evidence.
- **Owner / deadline:** Hosni (Hos) — 29 Nov 2026.
- **Status:** **Agreed; implementation to verify.** Whole-number constraints should be checked against the actual schema/specification; they were not separately confirmed in this decision.

#### #17 — Conflicting historical data
- **Decision:** Preserve source-backed conflicting records rather than overwriting one another; expose explicit **conflict flags**.
- **Rationale:** Historical discrepancies should remain auditable and visible to reviewers.
- **Owner / deadline:** Hosni (Hos) — 29 Nov 2026.
- **Status:** **Agreed; implementation to verify.**

#### #18 — Audit logging
- **Decision:** Maintain detailed, append-only audit records including **actor, action, entity, before/after data, time and request ID**; audit entry and business change must commit in the **same Prisma transaction**.
- **Rationale:** Track who changed what, and avoid successful business writes without an audit trail.
- **Owner / deadline:** Hosni (Hos) — 29 Nov 2026.
- **Status:** **Agreed — review needed.** An `AuditLog` model exists in the schema previously shared; transactional writes and append-only enforcement remain unverified.

#### #19 — Governorate timestamps
- **Decision:** Do **not** add `updatedAt` to `Governorate` solely for consistency; document the omission.
- **Rationale:** Avoid unnecessary schema migration and fields without a justified use.
- **Owner / deadline:** Hosni (Hos) — 29 Nov 2026.
- **Status:** **Agreed.**

#### #20 — Database indexing
- **Decision:** Keep existing indexes and add further indexes **based on real query patterns and measurements**.
- **Rationale:** Avoid speculative indexes while supporting commonly filtered and ordered queries.
- **Owner / deadline:** Hosni (Hos) — 29 Nov 2026.
- **Status:** **Agreed — review needed.** A possible non-unique `(villageId, year)` Population index is only a future consideration, not an approved migration.

#### #21 — Geocoding provider
- **Decision:** Continue with **Nominatim (OpenStreetMap)** for geocoding; honor the public service's usage policy and provide an identifying user agent.
- **Rationale:** Preserve the existing provider without introducing a paid dependency.
- **Owner / deadline:** Hosni (Hos) — 28 Nov 2026.
- **Status:** **Agreed — review needed.** Verify actual configured user agent/contact and compliance with provider restrictions.

#### #22 — Timeout and fallback
- **Decision:** Set geocoding timeout to **4,000 ms**, and **gracefully return village data without coordinates** if geocoding fails or times out.
- **Rationale:** Keep core village browsing available when the external service is slow or unreachable.
- **Owner / deadline:** Hosni (Hos) — 28 Nov 2026.
- **Status:** **Agreed; implementation to verify.**

#### #23 — Retry policy
- **Decision:** **No automatic retries** in user-facing requests to public Nominatim; use graceful fallback.
- **Rationale:** Avoid amplification of provider traffic and user-facing delays.
- **Owner / deadline:** Hosni (Hos) — 28 Nov 2026.
- **Status:** **Agreed; implementation to verify.**

#### #24 — Outbound provider rate limit
- **Decision:** Reuse in-memory LRU with an outbound throttle of at most **1 Nominatim request per second across the running application**. If waiting would exceed the user request's timeout budget, fall back instead.
- **Rationale:** Respect provider traffic limits without blocking users indefinitely.
- **Owner / deadline:** Hosni (Hos) — 28 Nov 2026.
- **Status:** **Agreed — review needed.** Verify behavior at runtime; process-local throttling does not by itself guarantee a global limit across multiple application instances.

#### #25 — Geocoding cache
- **Decision:** Cache successful geocoding responses for **24 hours**, but do **not** cache no-results, timeouts or errors. Retain in-memory LRU.
- **Rationale:** Reduce repeat provider calls while avoiding persistence of transient failures.
- **Owner / deadline:** Hosni (Hos) — 28 Nov 2026.
- **Status:** **Agreed — review needed.** Existing general `CACHE_TTL_SECONDS=300` is not the agreed 24-hour geocoding TTL; use a separate configuration if necessary without altering unrelated caches.

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
# Hosni (Hos) — Implementation Handoff
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
