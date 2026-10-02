# Task: Governorates detail + villages-by-governorate

**Owner:** Hos
**Branch:** `feature/governorates-extended`
**Depends on:** `main` (villages slice merged)

## Goal

Extend the existing governorates module with two endpoints:

- `GET /api/v1/governorates/:slug` — one governorate (detail)
- `GET /api/v1/governorates/:slug/villages` — paginated **verified** villages within one governorate

The second one is the interesting one: it joins two modules conceptually but **must not** import from the villages module. You'll reimplement the village list logic scoped by governorate, using the shared repository-layer pattern.

No create/update/delete, no auth, no search.

## Before you start

Read:

1. `qaryati-starter-guide.md` sections 3–6
2. `src/modules/governorates/` — every file. You're extending **this** module.
3. `src/modules/villages/` — every file, especially `villages.prisma-repository.ts`, `villages.service.ts`, `villages.schemas.ts`. You'll be mirroring the *list* logic but scoped to a governorate.
4. `src/modules/governorates/governorates.service.spec.ts` — the existing test style for this module.
5. `prisma/schema.prisma` — `Governorate`, `Village`, `VillageName`. Understand the FK `villages.governorateId`.

## Hard constraints

- Branch only, no force-push
- Prisma stays 6.12.0
- **Modules never import from other modules' internals.** You may NOT `import { villagesService } from '../villages'`. You reimplement or you ask before crossing.
- Only `*.prisma-repository.ts` imports `@prisma/client`
- No Prisma or Express in services
- `BigInt` / `Decimal` never leave the prisma repo
- `process.env` only from `src/config`
- No touching Docker, CI, unrelated files
- **Stop and ask if `prisma migrate` wants to reset**

## Step 1 — Understand the existing governorates module

Open `src/modules/governorates/governorates.service.ts` and `governorates.prisma-repository.ts`. Note:

- Does governorates currently have a `findBySlug` on the repository? If yes, you'll reuse it. If no, you'll add it.
- Is there a `getBySlug` on the service? If yes, you may only need to add the controller + route for detail.
- What does the existing `list()` on governorates look like — paginated? Does it return `meta`?

**Write down your findings before coding.** Your job is to fill gaps, not duplicate.

## Step 2 — No new migration

Both `governorates` and `villages` tables exist. No migration needed unless you find an obviously-missing index. If you add `@@index([governorateId, status])` to `Village` for the scoped list query, justify it — the current `@@index([governorateId])` and `@@index([status])` may already be sufficient at this scale.

If you do add an index:

```bash
npx prisma migrate dev --create-only --name villages_governorate_status_index
cat prisma/migrations/*villages_governorate_status_index*/migration.sql
npx prisma migrate dev
npx prisma migrate status
```

If `migrate status` shows drift, **stop and tell Ahmad.**

## Step 3 — Code

### `governorates.repository.ts` — extend the interface

Add these methods if not already present:

```typescript
export interface GovernorateDetail {
  slug: string;
  nameAr: string;
  nameEn: string;
  // add whatever other fields the Governorate model has that make sense publicly
  updatedAt: string;  // ISO
}

export interface FindVillagesInGovernorateArgs {
  governorateSlug: string;
  skip: number;
  take: number;
}

// On the existing GovernoratesRepository interface, add:
findBySlug(slug: string): Promise<GovernorateDetail | null>;
findVillagesPage(args: FindVillagesInGovernorateArgs): Promise<{
  items: VillageSummaryInGovernorate[];
  totalItems: number;
} | null>;  // null means "governorate not found"
```

Define `VillageSummaryInGovernorate` yourself. It should look like `VillageSummary` from villages but **do not import from villages** — copy the shape:

```typescript
export interface VillageSummaryInGovernorate {
  slug: string;
  name: { ar: string | null; en: string | null };
  municipality: string | null;
  updatedAt: string;  // ISO
}
```

Notice there's no `governorate` field — the caller already knows the governorate. That's a deliberate difference from the villages list shape. Document it in the PR.

### `governorates.prisma-repository.ts` — implement

- **Same rule as villages:** only file importing `@prisma/client`.
- For `findVillagesPage`:
  - First, verify the governorate exists. If not, return `null`.
  - Then query villages with `status = 'verified'` AND `deletedAt IS NULL` AND `governorateId = <that governorate's id>`.
  - **Include current official verified names in the same query** (join / include). Mirror how `villages.prisma-repository.ts` does it — copy the pattern, don't invent a new one.
  - Run count and page queries with `Promise.all`.
  - Convert `BigInt` and `Decimal`.
- Add a comment above `findVillagesPage` explaining the "null means governorate not found, empty array means governorate exists but has no verified villages" contract.

### `governorates.schemas.ts`

If a schemas file doesn't exist yet, create it. Add:

- Detail params: `slug` — same rule as villages slug (lowercase, digits, hyphens, max 100)
- Villages query: `page` (int ≥ 1, default 1), `pageSize` (int 1–100, default 20), optional `sort` (`'slug' | 'updatedAt'`, default `'slug'`), optional `order` (`'asc' | 'desc'`, default `'asc'`)

### `governorates.service.ts`

Add:

- `getBySlug(slug)`: call repo. If null → `throw new NotFoundError('Governorate not found')`. Return `{ data }`.
- `listVillages(slug, query)`:
  - Compute `skip = (page - 1) * pageSize`, `take = pageSize`.
  - Call repo. **If null → `throw new NotFoundError('Governorate not found')`.** If `{ items: [], totalItems: 0 }` → return 200 with empty data.
  - Return `{ data: items, meta: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) } }`.
- Reuse the same `PUBLIC_STATUS = 'verified'` idea. If governorates.service.ts doesn't already have it, define it with a comment referencing villages.service.ts as the source of the policy (a comment, not an import).
- **No Express, no Prisma.**

### `governorates.controller.ts`

Add two arrow handlers:

- `getBySlug`: `safeParse(req.params)`. On failure `ValidationError`. Call service. Respond `{ data }`.
- `listVillages`: `safeParse(req.params)` for slug AND `safeParse(req.query)` for pagination. Two safeParses; if either fails, throw `ValidationError` with all failures as `details`. Call service. Respond `{ data, meta }`.

### `governorates.routes.ts`

**Order matters critically here:**

```typescript
export function createGovernoratesRouter(controller: GovernoratesController) {
  const router = Router();
  router.get('/', controller.list);
  router.get('/:slug/villages', controller.listVillages);  // MUST come before /:slug
  router.get('/:slug', controller.getBySlug);
  return router;
}
```

If you put `/:slug` first, Express will match `/nablus/villages` against `/:slug` with `slug = "nablus/villages"` and 400 on slug validation. **Ordering is not optional.**

### `governorates.service.spec.ts` — extend

Add tests for:

1. `getBySlug` returns the governorate
2. `getBySlug` throws `NotFoundError` on null
3. `listVillages` computes skip/take for page 1
4. `listVillages` computes skip/take for page 3
5. `listVillages` totalPages = 0 when empty
6. `listVillages` totalPages = 1 when 1 item, pageSize 20
7. `listVillages` totalPages = 2 when 21 items, pageSize 20
8. `listVillages` throws `NotFoundError` when repo returns null (governorate missing)
9. `listVillages` returns empty data (200) when repo returns `{ items: [], totalItems: 0 }`
10. Schemas: slug validation (uppercase rejected, underscore rejected, too long rejected)
11. Schemas: `pageSize: 101` rejected, `page: 0` rejected, bad sort rejected

## Step 4 — Wire

You're extending an existing module, so `container.ts` probably already constructs a governorates service/controller. Update them to pass through the new methods. `app.ts` likely already mounts governorates at `/api/v1/governorates` — no change needed there.

**Heads-up:** Meho and Mah are also editing `container.ts`. Resolve conflicts by keeping both sides. If unclear, ping Ahmad.

## Step 5 — Verify

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx prisma migrate status
```

Then start the server and hit:

```bash
# Detail
curl -sS 'http://localhost:3000/api/v1/governorates/nablus'

# Villages in a governorate with 2 verified (from the seed)
curl -sS 'http://localhost:3000/api/v1/governorates/nablus/villages'

# Villages in a governorate with 0 verified — should be 200 with empty data
# (You'll need to identify which governorate. Check the seed.)

# Villages in a governorate that has only proposed villages — 200 with empty data
# (Again, check the seed.)

# Nonexistent governorate — 404
curl -sS -i 'http://localhost:3000/api/v1/governorates/atlantis/villages'

# Pagination
curl -sS 'http://localhost:3000/api/v1/governorates/nablus/villages?pageSize=1&page=2'

# Bad slug
curl -sS -i 'http://localhost:3000/api/v1/governorates/Bad_Slug/villages'

# Route ordering sanity — the detail endpoint still works
curl -sS 'http://localhost:3000/api/v1/governorates/nablus'
```

**The critical test:** `GET /api/v1/governorates/nablus/villages` must list only **verified** villages. If `hidden-spring` (proposed, in Jenin) appears under `/jenin/villages`, the status filter is missing from the repo query.

**The second critical test:** `GET /api/v1/governorates/nablus` must still work after you add `/:slug/villages`. If it 400s or 404s, your route ordering is wrong.

## Step 6 — PR

Base: `main`. Title: `feat(governorates): add detail and villages-by-governorate`.

In "Design decisions":
- Why the village summary in this response omits the governorate field (redundant here)
- Why you reimplemented the village-list logic instead of importing from villages (module boundary rule)
- Route ordering requirement — mention it explicitly so reviewers understand why `/:slug/villages` is registered before `/:slug`

In "How it was tested", paste the curl outputs and call out the two critical tests.

## Common mistakes to avoid

- **Route ordering.** `/:slug` before `/:slug/villages` breaks everything. This is the single most likely bug.
- **Importing from villages module.** Even importing a *type* is usually forbidden — copy the shape.
- **Returning 404 when governorate exists but has no villages.** That's a 200 with empty data. The repo's `null` vs `{ items: [], totalItems: 0 }` distinction is what makes this work.
- **Missing the status filter.** If proposed villages leak through, the repo isn't applying `status = 'verified'`.
- **Pagination when empty.** `totalPages` must be 0, not 1.
- **Registering the router twice in `app.ts`.** You shouldn't need to touch `app.ts` at all for this task; the governorates router is already mounted.