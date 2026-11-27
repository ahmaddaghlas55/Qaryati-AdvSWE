# Authentication and Authorization

## Status and architecture

Package B is an independently constructible module. The current root `src/app.ts` does not mount auth routes or the general rate limiter, and `src/server.ts` does not invoke admin bootstrap. These are shared integration tasks, not implemented behavior.

The module follows `AuthController -> AuthService -> AuthRepository -> PrismaAuthRepository`. Services depend on the repository interface and the `AuthCrypto`/`Clock` ports; Prisma types stay in the adapter. The router and policy functions can be mounted/tested independently. No public signup or admin-registration route exists.

## Credentials and tokens

- Passwords use bcrypt cost 12. Password input is bounded to bcrypt's 72-byte limit; password verification uses bcrypt comparison.
- Login rejects unknown, inactive, unsupported-role, and incorrect-password users with the same generic credential message.
- Access JWTs use HS256, the configured secret, a nonempty user ID subject, and exactly 15 minutes. Verification restricts the algorithm and requires a nonempty `sub`, integer `iat`/`exp`, and an exact 900-second lifetime. Signature/expiry verification is delegated to `jsonwebtoken`.
- Refresh tokens contain 32 cryptographically random bytes encoded as base64url. The API returns the raw token once; persistence receives only its SHA-256 digest. Refresh lifetime is seven days from issuance/rotation.
- Refresh replaces the old token in a Serializable Prisma transaction, records `replacedBy`, and marks the old token revoked. Reuse of a revoked token revokes the user's other active refresh tokens. Logout revokes by digest. Inactive users cannot log in, refresh, or authenticate with an access token.
- Auth code does not log credentials, password hashes, JWTs, or raw refresh tokens. Public user DTOs contain only ID, email, and role.

## Admin bootstrap

The owned service contract is:

```ts
bootstrapInitialAdmin(email?: string, password?: string): Promise<boolean>
```

Both values absent returns `false` without hashing or repository access. Partial, malformed, empty, or over-72-byte credentials raise a generic `ValidationError` without embedding credential values. Valid email is trimmed/lowercased; the password is bcrypt-hashed before repository access. The Prisma repository checks that there are zero users and creates an active `admin` in a Serializable transaction. It returns `false` when a user already exists; it never promotes or overwrites an existing account.

This operation is **not called by the application**. Current `src/config/env.ts` requires both `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD`, so absent environment values fail configuration validation before this optional service behavior can run. Ahmad must make these settings optional as a pair and invoke the service during approved startup/seed initialization. A partial pair must fail startup safely. Do not expose this operation over HTTP or log the supplied values.

**Startup integration proposal for Ahmad (not applied):**

1. Change the two env-schema entries to optional strings, with email validation for the email entry. Let the service reject a partial pair, or add a paired-presence refinement that reports only field names.
2. In `src/container.ts`, import `AuthController`, `createAuthCrypto`, `PrismaAuthRepository`, `AuthService`, and `SystemClock`; construct and expose `authService` and `authController` alongside the existing controllers:

	 ```ts
	 const authRepository = new PrismaAuthRepository(prisma);
	 const authService = new AuthService(
		 authRepository,
		 createAuthCrypto(config.JWT_SECRET),
		 new SystemClock(),
	 );
	 const authController = new AuthController(authService);
	 ```

3. Before `server.listen` in `src/server.ts`, call `await container.authService.bootstrapInitialAdmin(container.config.ADMIN_BOOTSTRAP_EMAIL, container.config.ADMIN_BOOTSTRAP_PASSWORD)`. On invalid configuration or persistence failure, abort startup and log only a generic error; never log environment values.
4. The repository's serializable count-and-create protects the first-user condition. Concurrent initialization may surface a serialization conflict; no automatic retry is currently implemented, so verify that behavior in the isolated database suite before enabling multiple startup replicas.

## HTTP contract

Mount `createAuthRouter` at `/api/v1/auth` after confirming the proposed contract. Controllers return the project's `{ data }` shape:

| Endpoint | Behavior | Current response status |
|---|---|---:|
| `POST /login` | Zod-validates email/password; issues user summary and access/refresh tokens | 200 |
| `POST /refresh` | Validates and rotates a refresh token | 200; invalid/reused is 401 |
| `POST /logout` | Revokes the submitted refresh token; returns `{ data: { loggedOut: true } }` | 200 |
| `GET /me` | Requires verified bearer identity; returns public user summary only | 200; missing/invalid identity is 401 |

Validation errors use the existing `ValidationError`; authentication and authorization use existing `AppError` subclasses and the shared five-field error envelope. No public registration endpoint is provided.

## Roles and policies

`AuthActor` is a plain `{ userId, role }` object, where authenticated roles are `contributor`, `verifier`, or `admin`; Public is represented by no actor. Bearer middleware verifies the token and looks up the active user in the repository, so client-supplied role/owner fields are not used to establish identity.

Policies in `src/modules/auth/authorization.policies.ts` cover published/non-deleted reads, proposal submission, own-pending edits, review of another user's pending proposal, mandatory nonblank rejection reason, soft-delete, restore, Admin-only role management, and validated Source creation. Admins cannot review their own proposals. Source validation/publishing does not approve claims that cite that Source.

These are reusable decisions, not domain mutation implementations. The current module does not persist review notes, retain rejected proposals, create revision proposals, or enforce these rules in Hosni's write services. Population and Historical Event models/workflows do not exist in the checked-in schema and are not represented here.

## User role management

The standalone user-role router exports `createUserRoleRouter` and is intended to be mounted at `/api/v1/users`; it is not mounted by the root application in this package. The resulting endpoint is `PATCH /api/v1/users/{id}/role`.

Request:

```json
{ "role": "contributor" }
```

`role` must be one of `contributor`, `verifier`, or `admin`. `Public` has no persisted user account and cannot be assigned. A successful response is `200` with `{ "data": { "id": "...", "email": "...", "role": "..." } }`; password hashes and refresh-token data are never selected for this response. Invalid body/role/ID returns `400`, unauthenticated callers receive `401`, non-Admins receive `403`, a missing target returns `404`, and a last-Admin or serialization conflict returns `409`.

The route authenticates from the bearer token and derives the actor from the active database user. It reuses `canManageRoles`; the service independently applies the same policy. Client-supplied actor IDs/roles do not establish authorization. Admin self-role changes are forbidden. A role update cannot leave zero active Admins. The repository checks this within a Serializable transaction and writes the role change and `AuditLog` entry atomically. Concurrent serialization conflicts fail safely with `409`.

The API contract and self/last-Admin behavior were confirmed for this implementation. Ahmad still needs to mount the router in `src/app.ts` under `/api/v1/users` and expose its controller/service through `src/container.ts`; no shared wiring was changed. The Prisma transaction and audit behavior are not covered by PostgreSQL integration tests in this repository.

## CORS and rate limiting

The existing root app applies `CORS_ORIGINS` through `container.config.corsOrigins`; the standalone CORS middleware also accepts an explicit allowlist. No wildcard origin is introduced.

`createRateLimiters({ windowMs, generalLimit, authenticationLimit })` returns reusable middleware with standard headers, 429 `RateLimitedError`, and Express's default client IP. Tests verify the configured 100-request general and 10-request auth thresholds. The auth router applies its injected limiter to all four auth routes. Root app mounting of the general limiter and auth router is still pending. No forwarded-header trust is configured; do not enable it without an explicit proxy topology.

**Mounting proposal for Ahmad (not applied):**

Add imports in `src/app.ts` for `createAuthRouter`, `authenticate`, and `createRateLimiters`, then mount the general limiter before versioned routes and the auth router with its auth limiter:

```ts
const limits = createRateLimiters({
	windowMs: container.config.RATE_LIMIT_WINDOW_MS,
	generalLimit: container.config.RATE_LIMIT_MAX,
	authenticationLimit: container.config.AUTH_RATE_LIMIT_MAX,
});
app.use('/api/v1', limits.general);
app.use('/api/v1/auth', createAuthRouter(container.authController, {
	authenticate: authenticate(container.authService),
	authenticationRateLimit: limits.authentication,
}));
```

Preserve the existing CORS middleware. The auth limiter is applied inside the router before its routes; the general limiter should be mounted before all versioned routes so auth requests count against both limits.

## Database constraints and concurrency

`AppUser.email` is unique and `RefreshToken.userId` has a Prisma relation to `AppUser`. `RefreshToken.tokenHash` is not unique, so lookup uses `findFirst`; database-enforced token-hash uniqueness is absent. `replacedBy` is a nullable scalar without a self-referencing relation/FK. Ask the database owner to review this minimal Prisma shape after checking existing rows for duplicate hashes and orphaned replacement IDs:

```prisma
tokenHash String @unique @map("token_hash")
replacedBy BigInt? @unique @map("replaced_by")
replacement RefreshToken? @relation("RefreshTokenRotation", fields: [replacedBy], references: [id], onDelete: SetNull)
replacedFrom RefreshToken? @relation("RefreshTokenRotation")
```

The corresponding migration needs a unique index on `token_hash` and a nullable self-FK on `replaced_by` (plus its unique index for the one-to-one relation). The schema owner must validate data and approve this migration; no schema or migration change is included here.

Rotation uses Serializable isolation and conditional revocation before creating the successor. A serialization conflict (`P2034`) is treated as reuse and triggers revocation of active tokens. This logic has only fake-repository/unit coverage so far; it has not been exercised against concurrent PostgreSQL transactions or rollback failures.

## Configuration and secret handling

Expected deployment variables include `JWT_SECRET` (at least 32 characters), `CORS_ORIGINS`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX=100`, `AUTH_RATE_LIMIT_MAX=10`, and the optional bootstrap pair after the shared env schema is updated. Access/refresh lifetimes remain fixed in the auth implementation at 15 minutes and 7 days. Keep `.env` local; `.env.example` contains placeholders only. Inject production secrets via deployment configuration. Never include secret values in logs or documentation.

## Tests and integration setup

Run unit checks with:

```sh
npm run typecheck
npm run lint
npm test
```

There is currently no auth PostgreSQL integration spec and `test/integration/` contains only `.gitkeep`. No `TEST_DATABASE_URL` is configured in this environment, so persistence, bootstrap transaction, rollback, and concurrent-refresh tests are **BLOCKED / NOT RUN**. Do not point integration commands at the local `.env` database.

When an isolated throwaway PostgreSQL database is provisioned, use a dedicated URL, for example `postgresql://qaryati_test:replace_me@localhost:5434/qaryati_auth_test`, never a developer/shared/production database. Set `DATABASE_URL` to that isolated URL, run `npx prisma migrate deploy`, then `npm run test:integration`. The integration suite should cover first-admin creation and repeat/existing-user behavior; refresh-token persistence, rotation, logout revocation, expired/inactive users, sequential replay, two concurrent refreshes, and transaction rollback. Fixture cleanup must target only IDs created by the test. `jasmine.integration.json` now uses the same CommonJS loader as the unit suite so future TypeScript specs use the registered ts-node hook under Node 24.

Root route mounting, startup bootstrap, general rate-limit mounting, domain policy enforcement, trusted-proxy decisions, and PostgreSQL integration tests remain coordination items; none are claimed as complete by this module documentation.