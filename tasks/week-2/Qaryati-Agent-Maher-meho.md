# Qaryati — Standalone AI Agent Handoff: Maher (meho)

**Assigned engineer:** Maher (meho)  
**Independent work package:** B — Authentication & Reusable Authorization  
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

# PACKAGE B — Maher (meho): Authentication & Reusable Authorization

**Goal:** Implement a self-contained auth/identity/security module on top of **existing** `AppUser` and `RefreshToken` models and produce reusable authorization functions and middleware. Do not wait for Hosni's write endpoints to apply them.

**Owned files/directories (principal):** `src/modules/auth/` and own `src/shared/security/` or suitable existing auth/security folder, related specs; local module-only router and middleware; security documentation. **Do not touch:** village/source Prisma repositories, population/events schema, data review endpoints, central router wiring until integration phase.

### B1. User authentication and credentials
- Inspect actual `AppUser` and `RefreshToken` schema, then implement authentication using bcrypt and the agreed JWT access/refresh design.
- Access-token TTL **15 minutes**; refresh-token TTL **7 days**.
- Validate credentials and issue access + refresh token; store only hashed refresh-token identifiers/secrets in DB according to existing schema; rotate/revoke on refresh and logout, and prevent reuse of revoked tokens.
- Design admin bootstrap on existing env config if not already implemented. Do not expose a public admin-registration route.
- If public signup is not specified, do **not** silently invent it; document whether initial user creation is admin-controlled.

### B2. Proposed auth contract (confirm exact paths before merge)
- `POST /api/v1/auth/login`: credential validation and token issue.
- `POST /api/v1/auth/refresh`: rotate valid refresh token.
- `POST /api/v1/auth/logout`: revoke current refresh token.
- `GET /api/v1/auth/me`: authenticated user summary.
- Admin-only user role management module/service and a route only after confirming the course spec and existing models.
- Standardize response and error DTOs using existing application error types.

### B3. Authorization foundation — independent of domain modules
- Define `AuthActor` (e.g., `{ userId, role }`) as a plain application-facing type, not a Prisma or Express type.
- Implement bearer token verification, `requireAuthenticated`, `requireRole`, and policy functions that can accept an actor and resource facts such as owner ID, status, and review actor ID.
- Rule: Public can read published records; Contributor/Verifier/Admin can submit proposals and edit **their own pending** proposals; Verifier/Admin can review **other people's** proposals; Verifier/Admin can soft-delete/restore; Admin alone manages roles; validated source metadata may publish immediately.
- A reviewer may not approve/reject their own proposal. Reject must include a reason; approval note optional (validate those rules in policy/use-case tests).
- Keep `auth` transport and policies generic; don't import Hosni's future modules.

### B4. CORS, inbound rate limiting and secret safety
- Preserve environment-specific `CORS_ORIGINS` allowlists; verify actual frontend/client origins instead of assuming `localhost:3000` is the right allowed origin.
- Implement or verify **100 requests/min/IP** generally and **10 requests/min/IP** on authentication endpoints; test handler behavior and appropriate 429 responses. This is separate from Nominatim **outbound** limit.
- Ensure `.env` isn't committed, `.env.example` uses placeholders, JWT secrets aren't logged, and Docker deployment secrets can be injected.
- Don't change root middleware files during independent phase; expose configured middleware for later mounting.

### B5. Tests & acceptance
- Unit-test valid/invalid password, token TTL/expiry, refresh rotation/revocation, malformed token, role enforcement, self-approval denial, owner-of-pending check, login rate limit and CORS behavior.
- Test module via a **standalone Express test app** mounted in the test file, without relying on Ahmad/Hosni implementation. Use fakes for unit tests; focused DB tests may use the existing schema if safely isolated.
- Deliver PR `feature/auth-security` with module router export, actor contract, middleware/policy API and tests.

**Independent completion condition:** Module works in standalone test harness against existing user/token models, and exposes importable middleware/policies. Adding it to `src/app.ts` is a later integration task.

---

---

## Agent-specific execution sequence and implementation guidance

**Your repository authority:** `src/modules/auth/`, module-owned `*.schemas.ts`/service/repository/router, dedicated policy/security helpers if needed, related unit specs and auth/security notes. Avoid modifying root app/container, source/village repositories or Prisma schema during independent phase.

**Do these in priority order:**
1. **Inspect `AppUser` and `RefreshToken`** model fields and any existing auth stubs, deps and configuration. Confirm the real password hash column and token hash/revocation columns before coding. `AppUser.role` was observed as a string with `contributor` default; validate role input against agreed values without assuming a Prisma enum.
2. **Implement auth use cases** with bcrypt password hash verification, generic invalid-login messages, 15-minute signed JWT access tokens, refresh secrets expiring after 7 days, hashed refresh token storage, rotation and revocation on use/logout, replay rejection. Use cryptographically sound signing/secrets; don't print tokens or raw credentials to logs. Handle expired/disabled/revoked users according to schema and spec.
3. **Develop module-only router** (proposed routes `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me`, all under `/api/v1` once mounted), with Zod, error format and no root wiring. Document actual path contracts as proposed until integrated. No open public admin signup. Implement initial user/bootstrap only if consistent with existing config/spec and without schema ownership conflicts.
4. **Create plain `AuthActor` and policy port** usable without importing a village/population module: `canSubmit`, `canEditOwnPending`, `canReviewOther`, `canSoftDelete`, `canRestore`, `canManageRoles`. Identity must be inferred from verified JWT, never trusted body `actorId`. Require the original creator ID and pending status for owner editing; disallow review of own submission even by Admin. Only Verifier/Admin approve/reject and soft-delete/restore. Source metadata passes validation and may auto-publish; no endorsement of linked historical claims.
5. **Inbound security middleware:** implement composable general 100 req/min/IP and auth 10 req/min/IP, 429 and testable timing, without altering root `app.ts` yet; avoid blindly trusting forged proxy headers. Keep existing CORS allowlist, check origin use; verify `.env` exclusions, secret redaction and CI/Docker secret injection, coordinating fix requests with Mahmood for files he owns.
6. **Standalone tests** with module-local Express test app, fake users/token repository and fake clock: valid login, bad credentials, exp/refresh rotate/reuse, malformed bearer, contributor/verifier/admin policy cases, self-approval denial, rejection note, safe rate-limit behavior. Test real DB only against an isolated DB if practical, otherwise flag exact missing coverage.

**Acceptance proof:** service and middleware APIs independently importable; standalone router works without modifying central wiring; no other agent's branch required; tests pass and policy matrix covered. Document assumptions about user onboarding and admin bootstrap. **PR name:** `feature/auth-security`.

**Common pitfalls:** token hashing is not password hashing; rotate refresh tokens atomically where appropriate, protect refresh replay; JWT TTL env strings must be parsed correctly; policy functions must not trust a client-supplied role; rate limits apply inbound and are independent of Hosni's 1req/s outbound geocoder throttle.


---

## Relevant agreed team decisions (source register excerpts)

#### #2 — Password hashing
- **Decision:** Use **bcrypt** for password hashing.
- **Rationale:** Maintain a standard one-way password-hashing approach.
- **Owner / deadline:** Maher (meho) — 29 Nov 2026.
- **Status:** **Agreed; implementation to verify.**

#### #3 — Tokens and lifetimes
- **Decision:** JWT access tokens expire after **15 minutes**; refresh tokens after **7 days**.
- **Rationale:** Limit access-token exposure while preserving a usable login session.
- **Owner / deadline:** Maher (meho) — 29 Nov 2026.
- **Status:** **Agreed — review needed.** Ensure actual issuance, expiration and refresh-token handling match the configuration.

#### #11 — Roles
- **Decision:** Support **Public**, **Contributor**, **Verifier**, and **Admin**. Public needs no account.
- **Rationale:** Separate public reading, contribution, approval and administration.
- **Owner / deadline:** Maher (meho) — 29 Nov 2026.
- **Status:** **Agreed — review needed.** Existing `AppUser.role` was a string defaulting to `contributor`; review actual role checks and provision of verifier/admin capabilities.

#### #12 — Permission matrix
- **Decision:** Apply the following authorization rules, aligned with #13 and #14:

| Action | Public | Contributor | Verifier | Admin |
|---|:---:|:---:|:---:|:---:|
| View published records | Yes | Yes | Yes | Yes |
| Submit proposals | No | Yes | Yes | Yes |
| Edit own **pending** proposals | No | Yes | Yes | Yes |
| Approve/reject **other users'** manual-review proposals | No | No | Yes | Yes |
| Create validated, automatically published Sources | No | Yes | Yes | Yes |
| Soft-delete records | No | No | Yes | Yes |
| Restore records | No | No | Yes | Yes |
| Manage user roles | No | No | No | Yes |

- **Rationale:** Restrict privileged changes, prohibit self-approval, and allow contributors to submit evidence without automatically publishing unverified historical claims.
- **Owner / deadline:** Maher (meho) — 29 Nov 2026; coordinate with Hosni (Hos) on entity write paths.
- **Status:** **Agreed; implementation to verify.** Record visibility and permissions must also honor deleted statuses and #15.

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

#### #26 — CORS
- **Decision:** Use **environment-specific CORS origin allowlists**, keeping the existing `CORS_ORIGINS` configuration variable.
- **Rationale:** Allow known frontends while preventing unrestricted cross-origin browser requests.
- **Owner / deadline:** Maher (meho) — 29 Nov 2026.
- **Status:** **Agreed — review needed.** Confirm listed origins actually match the frontend origins used in each environment.

#### #27 — Inbound rate limiting
- **Decision:** Set general API rate limiting to **100 requests/minute/IP** and authentication rate limiting to **10 requests/minute/IP**.
- **Rationale:** Limit abusive traffic and protect authentication endpoints.
- **Owner / deadline:** Maher (meho) — 29 Nov 2026.
- **Status:** **Agreed — review needed.** Relevant environment variables exist; verify middleware, route placement, response behavior and trusted proxy/IP handling.

#### #28 — Secrets handling
- **Decision:** Keep `.env` local, **never commit real secrets**, provide safe placeholders in `.env.example`, and inject production secrets in deployment.
- **Rationale:** Avoid leaking database credentials, JWT secrets and admin bootstrap credentials.
- **Owner / deadline:** Maher (meho), coordinating with Mahmood (Mah) for deployment — 29 Nov 2026.
- **Status:** **Agreed — review needed.** Inspect `.gitignore`, CI and Docker settings; rotate any secrets ever exposed accidentally.

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
# Maher (meho) — Implementation Handoff
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
