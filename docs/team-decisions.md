# Qaryati — Team Decisions

**Project:** Qaryati  
**Decision log:** 40 of 40 decisions addressed  
**Document date:** 26 November 2026  
**Decision deadline:** Before 1 December 2026  
**Implementation status:** Not all decisions have been verified in the repository. **Agreed** means a team decision was made; it does **not** mean the feature is implemented.

## 1. Team and ownership

| Member | Nickname | Owned functional areas | Decision deadline |
|---|---|---|---|
| Ahmad | dug | Architecture & Configuration | 28 Nov 2026 |
| Ahmad | dug | API Design | 29 Nov 2026 |
| Maher | meho | Authentication & Security | 29 Nov 2026 |
| Hosni | Hos | Database & History | 29 Nov 2026 |
| Hosni | Hos | External API | 28 Nov 2026 |
| Mahmood | Mah | Testing & Performance | 30 Nov 2026 |
| Mahmood | Mah | Delivery & Documentation | 30 Nov 2026 |

Each area owner is accountable for coordinating and checking its decisions, not necessarily performing every implementation task alone. Cross-area decisions require coordination between the listed owners. Deadlines above are **decision/documentation deadlines**, not proof that a feature is complete.

### Status legend

- **Agreed:** Policy or design choice confirmed by the team.
- **Agreed — review needed:** Decision confirmed; the existing code or course requirement must still be checked.
- **Implementation to verify:** No assertion of working implementation has been made, even when relevant code or configuration exists.

## 2. Decision register

### A. Technology stack and configuration (#1–6)

#### #1 — Node.js version
- **Decision:** Use **Node.js 22**; preserve the existing Dockerfile version.
- **Rationale:** Match the currently selected runtime and avoid unnecessary version changes.
- **Owner / deadline:** Ahmad (dug) — 28 Nov 2026.
- **Status:** **Agreed — review needed.** The team's rulebook previously mentioned Node.js 20; verify or update that documentation consistently and ensure the course imposes no conflicting requirement.

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

### B. Architecture and data access (#7–10)

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

#### #9 — Database transactions
- **Decision:** Preserve the Prisma **`UnitOfWork`** using `$transaction`; require an atomic transaction for logically linked multi-step writes.
- **Rationale:** Related state changes should either all succeed or all fail.
- **Owner / deadline:** Hosni (Hos) — 29 Nov 2026.
- **Status:** **Agreed — review needed.** The `UnitOfWork.run()` wrapper has been seen; inspect actual use in write paths.

#### #10 — DTO mapping and response shaping
- **Decision:** Continue **service-level response shaping**, preserving the current controller/service separation.
- **Rationale:** Existing services already assemble API response structures; avoid duplicating transformation layers.
- **Owner / deadline:** Ahmad (dug) — 28 Nov 2026.
- **Status:** **Agreed — review needed.** Village list service shapes pagination metadata, but repository field selection and all response exposure should be checked.

### C. Roles and moderation (#11–14)

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

### D. Data, history and database (#15–20)

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

### E. External geocoding service (#21–25)

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

### F. Application security (#26–28)

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

### G. API behavior and documentation (#29–33)

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

### H. Testing and performance (#34–35)

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

### I. Delivery and documentation (#36–39)

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

### J. Team accountability (#40)

#### #40 — Named owner and deadline
- **Decision:** Assign a named owner and deadline to each mandatory work area, as shown in Section 1. All agreed deadlines fall on **28–30 November 2026**, before 1 December.
- **Rationale:** Ensure clear responsibility and a concrete deadline for every part of the decision log.
- **Owner / deadline:** All four team members — by 30 Nov 2026.
- **Status:** **Agreed.** Owners are assigned by functional area; a more granular per-item task tracker may be maintained if the course requires it.

## 3. Implementation verification checklist

**Important:** Checkboxes below are **not** evidence of failure or missing implementation; they indicate work not yet confirmed from the code and test results reviewed together.

### Ahmad (dug) — Architecture & Configuration / API Design
- [ ] Confirm centralized `envSchema` is parsed on startup (#6).
- [ ] Ensure runtime/architecture documentation matches chosen Node.js 22 and layered monolith (#1, #7).
- [ ] Check repository field selection and service-level response shaping (#10).
- [ ] Apply `slug ASC` as the secondary sort in both `updatedAt` order branches; preserve existing defaults (#32).
- [ ] Review other collection endpoints' sort defaults (#32).
- [ ] Confirm Postman workflow and produce/validate actual `docs/api/openapi.yaml` (#33).

### Maher (meho) — Authentication & Security
- [ ] Verify bcrypt and JWT access/refresh-token behavior (#2–3).
- [ ] Check all four roles and permission enforcement, including ownership and no self-approval (#11–13).
- [ ] Check automatic Sources vs manually reviewed records, rejection notes and proposal retention (#13).
- [ ] Verify soft-delete/restore authorization for Verifier **and** Admin (#14).
- [ ] Verify origin allowlists and general/auth rate limiting (#26–27).
- [ ] Check `.gitignore`, `.env.example`, deployment secrets and bootstrap safety (#28).

### Hosni (Hos) — Database & History / External API
- [ ] Verify transactional writes and audit logging in the same transaction (#9, #18).
- [ ] Check historical-name public visibility and soft-deleted filtering (#15).
- [ ] Verify population validation, source-specific duplicates and conflict flags when implemented (#16–17).
- [ ] Review indexes for actual queries (#20).
- [ ] Verify Nominatim identifying user agent, provider policy and 4,000 ms graceful timeout (#21–22).
- [ ] Confirm no automatic retries and the agreed per-application outbound 1 request/second throttle (#23–24).
- [ ] Configure/verify 24-hour successful geocoding cache, excluding errors and misses (#25).

### Mahmood (Mah) — Testing & Performance / Delivery & Documentation
- [ ] Review unit tests using fake repositories and isolated-database integration tests (#34).
- [ ] Run k6 baseline and record actual p95/error metrics, then compare after measured optimization (#35).
- [ ] Test `docker compose up --build` and confirm automated CI image build (#36).
- [ ] Verify the Git merge policy against the actual course rulebook (#37).
- [ ] Create ADR-001, ADR-002 and ADR-003 under `docs/adr/` (#38).
- [ ] Add only missing required README material, ADR links and testing instructions (#39).

## 4. Recommended next steps

1. **Commit this decision log as documentation** after team review; it does not modify runtime behavior.
2. **Each owner checks existing work first** and labels tasks as already implemented, missing or needing a narrow fix.
3. **Apply minimal targeted changes**, starting with the known #32 timestamp-sort tie-breaker.
4. **Verify security, persistence and external service behavior**, particularly the newly finalized #12–13 policy.
5. **Create ADRs and complete README**, comparing all deliverables with the course specification.
6. **Run tests and record evidence** before marking implementation checks complete.

## 5. Notes and constraints

- Preserve working application code and existing folder structure; no broad rewrite is authorized by this document.
- The supplied schema excerpts confirm certain models and code fragments, **not** the entire application's functionality.
- This is the team's **decisions document**, not an implementation completion certificate.
- If the course rulebook conflicts with an agreed approach, record the discrepancy and resolve it explicitly rather than silently changing code or inventing requirements.
