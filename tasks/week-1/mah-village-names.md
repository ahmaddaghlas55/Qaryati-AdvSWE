# Task: Village names sub-resource

**Owner:** Mah
**Branch:** `feature/village-names`
**Depends on:** `main` (villages slice merged)

## Goal

Add a read-only **names** sub-resource to the villages module:

- `GET /api/v1/villages/:slug/names` — all current names for one village, grouped by language
- `GET /api/v1/villages/:slug/names/history` — every name ever recorded for the village, including non-current ones (superseded, former, historical)

No create/update/delete, no auth, no search. This is a lens into the `village_names` table that villages already populates.

## Before you start

Read:

1. `qaryati-starter-guide.md` sections 3–6
2. `src/modules/villages/` — every file. You're extending it.
3. `prisma/schema.prisma` — models `Village` and `VillageName`. **Study the `VillageName` fields carefully**: `value`, `language`, `type`, `isCurrent`, `validFrom`, `validTo`, `meaningOrOrigin`, `status`, `supersedesId`.
4. The partial unique index `one_current_official_name` — understand what it enforces before writing queries.
5. `src/modules/villages/villages.service.spec.ts` — your test style.
6. `src/modules/villages/villages.prisma-repository.ts` — see how names are currently joined. **You will reuse that pattern.**

## Hard constraints

Same as villages. Copy them into your head:

- Branch only, no push --force
- Prisma stays 6.12.0
- Only `*.prisma-repository.ts` imports `@prisma/client`
- `BigInt` / `Decimal` never leave the prisma repo
- No Prisma or Express imports in services
- `process.env` only from `src/config`
- No touching Docker, CI, or unrelated files
- **Stop and ask if `prisma migrate` wants to reset**

## Step 1 — Design the response shape

Before writing code, decide the shape of `GET /:slug/names`. Two reasonable options — pick one, write it down, and defend it in the PR description.

**Option A — flat list, client groups:**

```json
{
  "data": [
    { "language": "ar", "type": "official", "value": "قرية شروق الوادي", "isCurrent": true },
    { "language": "en", "type": "official", "value": "Sunrise Hollow",   "isCurrent": true }
  ]
}
```

**Option B — grouped by language, client picks:**

```json
{
  "data": {
    "ar": { "official": "قرية شروق الوادي", "alternatives": [] },
    "en": { "official": "Sunrise Hollow",   "alternatives": [] }
  }
}
```

Option A is simpler and matches how the DB stores rows. Option B is friendlier for consumers but couples the API to a specific grouping. **Recommendation: Option A.** It's more extensible (adding `historical`, `transliteration`, etc. requires zero shape change).

For `/:slug/names/history`, return every name row for the village including non-current ones, ordered by `validFrom` descending then `id` descending.

## Step 2 — No new migration

The tables already exist. **Do not create a migration** unless you discover a genuinely missing index. If you think you need one, ask Ahmad first.

If you find a slow query (unlikely at this scale), you may add `@@index([villageId, language, isCurrent])`. But justify it.

## Step 3 — Code

Create these files under `src/modules/villages/`:

### `villages.names.repository.ts`

```typescript
export interface VillageNameItem {
  id: number;
  language: string;
  type: string;
  value: string;
  isCurrent: boolean;
  validFrom: string | null;
  validTo: string | null;
  meaningOrOrigin: string | null;
}

export interface VillageNamesRepository {
  findCurrentByVillageSlug(slug: string): Promise<VillageNameItem[] | null>;
  findHistoryByVillageSlug(slug: string): Promise<VillageNameItem[] | null>;
}
```

**Important design decision:** `findCurrentByVillageSlug` returns `null` if the **village** doesn't exist or isn't verified; returns an empty array `[]` if the village exists but has no matching names. **The service needs to distinguish "village not found" (404) from "no names yet" (200 with empty array).** Get this right — it's the subtle part of the task.

Add a comment in the interface explaining the contract.

### `villages.names.prisma-repository.ts`

- Only file importing `@prisma/client` for this sub-resource.
- **Reuse the village lookup logic already in `villages.prisma-repository.ts`** — specifically: the village must be `status = 'verified'` and `deletedAt IS NULL`. Do not duplicate this filter carelessly; if the villages repo already exports a helper, use it. If not, replicate the exact same filter and add a comment linking back to the villages repo so a future refactor catches both.
- `findCurrentByVillageSlug`: return names where `isCurrent = true` AND `status = 'verified'` AND `deletedAt IS NULL`. **Include both official and non-official current names** if you want — or restrict to official. Decide and document.
- `findHistoryByVillageSlug`: every non-deleted name for the village, ordered by `validFrom DESC NULLS LAST, id DESC`.
- Convert `BigInt` id to `number`.

### `villages.names.schemas.ts`

- Params: `slug` — lowercase letters, digits, hyphens, max 100 (same rule as villages.schemas.ts)
- Query (both endpoints): nothing required. If you add pagination later, put it here.

### `villages.names.service.ts`

- Reuses the same `PUBLIC_STATUS` constant idea — read villages.service.ts and either import the constant (if it's exported and allowed) or redefine with a comment. **Prefer exporting it from `villages.service.ts` and importing** if the service is in the same module — that's not a cross-module import, it's the same module.
- `listCurrent(slug)`:
  - Call repo. If null → `throw new NotFoundError('Village not found')`.
  - If array → return `{ data: array }`.
- `listHistory(slug)`: same contract.
- **No Express, no Prisma.**

### `villages.names.controller.ts`

- Two arrow handlers.
- `safeParse` the slug param. On failure, `ValidationError`.
- Respond `{ data }` (no meta for these — they're not paginated).

### `villages.names.routes.ts`

```typescript
export function createVillageNamesRouter(controller: VillageNamesController) {
  const router = Router({ mergeParams: true });  // NOTE: mergeParams
  router.get('/', controller.listCurrent);
  router.get('/history', controller.listHistory);
  return router;
}
```

**`mergeParams: true` is critical** — without it, `:slug` from the parent router is not visible. This is the #1 mistake people make with nested routers.

### Mounting

In `villages.routes.ts` (existing file), mount the names router:

```typescript
router.use('/:slug/names', createVillageNamesRouter(namesController));
```

**Order matters**: mount the names router *before* the `/:slug` detail route, otherwise `GET /villages/sunrise-hollow/names` will be swallowed by `/villages/:slug` and 404 because "sunrise-hollow/names" isn't a valid slug.

Actually — with Express 5 and distinct path shapes (`/:slug/names` vs `/:slug`), order usually doesn't matter. But mount names first anyway; it's more defensive and clearer to read.

### `villages.names.service.spec.ts`

Cover:

1. `listCurrent` calls repo with the slug
2. `listCurrent` returns `{ data: [] }` when repo returns `[]`
3. `listCurrent` throws `NotFoundError` when repo returns `null`
4. `listHistory` same three cases
5. Schemas: bad slug (uppercase, underscore, too long) rejected
6. Schemas: valid slug accepted

## Step 4 — Wire into container

In `src/container.ts`, add:
- `VillageNamesPrismaRepository`
- `VillageNamesService`
- `VillageNamesController`

And pass the controller into `createVillageRouter` (which you'll have to update to accept a second argument).

**Heads-up:** `container.ts` and `app.ts` are shared with Meho and Hos. Resolve conflicts by keeping both sides' additions. If the conflict is on `app.ts`, both lines are independent `app.use` — keep both.

## Step 5 — Verify

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx prisma migrate status
```

All must pass. Then:

```bash
set -a; . ./.env; set +a
npm run dev
```

In a second terminal or Postman:

```bash
# Current names for a verified village
curl -sS 'http://localhost:3000/api/v1/villages/sunrise-hollow/names'

# Full history
curl -sS 'http://localhost:3000/api/v1/villages/sunrise-hollow/names/history'

# Verified village with no names — should be 200 with empty data, NOT 404
# (You may need to insert one manually or accept "unknown" here.)

# Proposed village — MUST be 404
curl -sS -i 'http://localhost:3000/api/v1/villages/hidden-spring/names'

# Bad slug — MUST be 400
curl -sS -i 'http://localhost:3000/api/v1/villages/Bad_Slug/names'

# The detail route still works
curl -sS 'http://localhost:3000/api/v1/villages/sunrise-hollow'
```

**The proposed-village 404 is the key test.** `hidden-spring` is `status='proposed'` in the seed and must never be readable, even via the names sub-resource. If it returns 200 with names, the village-lookup in your repo isn't applying the verified filter. Fix before submitting.

## Step 6 — PR

Base: `main`. Title: `feat(villages): add names sub-resource`.

In "Design decisions":
- Option A vs Option B response shape and why
- The null-vs-empty-array contract on the repo, and why it matters
- Whether you restrict to official names or return all current names, and why
- Whether you export `PUBLIC_STATUS` from `villages.service.ts` or redefined it

In "How it was tested", paste the curl outputs and highlight the proposed-village 404.

## Common mistakes to avoid

- **Forgetting `mergeParams: true`** — then `req.params.slug` is undefined and every request 404s or 500s.
- **Mounting names AFTER `/:slug`** — safer to mount names first.
- **Returning `null` when the village has zero names** — that's a `[]`, not a `null`. `null` means "village not found". Confusing them creates false 404s.
- **Duplicating the "verified" filter without a comment linking to villages repo** — when someone changes the policy, they'll miss your copy.
- **A `BigInt` id in the response** — convert in the repo.