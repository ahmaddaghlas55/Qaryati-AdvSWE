# Task: Sources read-only module

**Owner:** Meho
**Branch:** `feature/sources-list`
**Depends on:** `main` (villages slice merged)

## Goal

Build a read-only **sources** slice:
- `GET /api/v1/sources` — paginated list of sources, filterable by `type` and `publicationYear`
- `GET /api/v1/sources/:id` — one source by numeric id

No create/update/delete, no auth, no search. Sources are the citation/provenance records that villages, village_names, and other facts link to via `sourceId`.

## Before you start

Read in this order — do not skip:

1. `qaryati-starter-guide.md` sections 3–6 (layer rules, module layout, error format)
2. `src/modules/villages/` — every file. This is your reference implementation.
3. `src/container.ts` and `src/app.ts` — see how villages is wired.
4. `prisma/schema.prisma` — find the `Source` model. **Note every field and check for a `status` or `deletedAt` column** — you'll need to know whether sources are soft-deletable.
5. `src/modules/villages/villages.service.spec.ts` — the test style you'll mirror.

## Hard constraints

- Work on your branch. **Do NOT run `git commit` until the reviewer (Ahmad) says so, and never `git push --force`.**
- Do NOT change dependency versions. Prisma stays at 6.12.0.
- Do NOT touch Docker, CI, or unrelated files.
- **Modules never import from other modules' internals.** If you need a type from villages, redefine it locally or ask before crossing the line.
- Services must NOT import Express or Prisma. **Only `sources.prisma-repository.ts` may import `@prisma/client`.**
- Prisma types (`BigInt`, `Decimal`) must NOT leave the prisma-repository file. Convert before returning.
- `process.env` may only be read from `src/config`.
- If `prisma migrate` wants to reset the DB or reports drift, **STOP and tell Ahmad.** Never wipe data.

## Step 1 — Check the schema

Open `prisma/schema.prisma` and find `model Source`. Copy its exact field list into your notes. You will need:

- Which fields exist (title, author, publisher, url, publicationYear, type, etc.)
- Whether there is a `status` field with allowed values
- Whether there is a `deletedAt` field
- Which other models reference Source (search for `Source @relation`)

**Write down the answer to this before proceeding: does Source have a status column, and if so, what values?**

If it does NOT have a status column, the "public API only returns verified" rule from villages doesn't apply here — instead you filter only `deletedAt IS NULL` (if that column exists) or return everything.

If you find Source has no soft-delete and no status, mention it in the PR description — the reviewer needs to know why there's no filtering.

## Step 2 — Migration (only if needed)

**You probably don't need a new migration.** Source already exists. You might need indexes if the schema doesn't have any on `type` or `publication_year`. Check with:

```bash
docker compose exec -T db psql -U qaryati -d qaryati -c "\d sources"
```

If there is no index on `type`, add one to `schema.prisma`:

```prisma
@@index([type])
```

Then create the migration:

```bash
npx prisma migrate dev --create-only --name sources_type_index
cat prisma/migrations/*sources_type_index*/migration.sql
```

Read the SQL. It should only be `CREATE INDEX`. If it contains `DROP` or `ALTER` on anything unrelated, **stop and tell Ahmad.**

Apply:

```bash
npx prisma migrate dev
npx prisma migrate status
```

If `migrate status` reports drift, **stop.** Paste the output to Ahmad.

If the schema already has the index you need, skip this step entirely — the README in the repo should be fine with no new migration for a purely-read module on existing tables.

## Step 3 — Module code

Create these files under `src/modules/sources/`:

### `sources.repository.ts`

```typescript
// Domain types (plain TS, no Prisma types)
export interface SourceSummary {
  id: number;            // convert from BigInt in the prisma repo
  title: string;
  type: string;
  publicationYear: number | null;
  author: string | null;
  updatedAt: string;     // ISO string
}

export interface SourceDetail extends SourceSummary {
  publisher: string | null;
  url: string | null;
}

export interface FindSourcesPageArgs {
  type?: string;
  publicationYear?: number;
  skip: number;
  take: number;
}

export interface SourcesRepository {
  findPage(args: FindSourcesPageArgs): Promise<{ items: SourceSummary[]; totalItems: number }>;
  findById(id: number): Promise<SourceDetail | null>;
}
```

### `sources.prisma-repository.ts`

Implement the interface using `PrismaClient`. Rules:

- **Only file in this module that imports `@prisma/client`.**
- Convert `BigInt` → `number` and `Decimal` → `number` before returning. **Never** let a `BigInt` reach the service or controller — it breaks `JSON.stringify`.
- Exclude soft-deleted rows if `deletedAt` exists on Source.
- Run count and page queries together with `Promise.all`.
- Order results by `title` ascending by default (or `publicationYear desc` — pick one and document it).

### `sources.schemas.ts`

Zod schemas:

- **List query:**
  - `page`: int ≥ 1, default 1
  - `pageSize`: int 1–100, default 20
  - `type`: optional string, max 50 chars
  - `publicationYear`: optional int between 1800 and current year
- **Detail params:**
  - `id`: string that parses to a positive integer (use `z.coerce.number().int().positive()`)

### `sources.service.ts`

- Named constant `DEFAULT_ORDER` if you want to be explicit.
- `list(query)` computes `skip = (page - 1) * pageSize`, `take = pageSize`, calls the repository, and returns:
  ```ts
  {
    data: SourceSummary[];
    meta: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) };
  }
  ```
  **When totalItems = 0, totalPages must be 0** (not 1).
- `getById(id)` calls the repository. If it returns null, `throw new NotFoundError('Source not found')`. **Reuse** the existing `NotFoundError` from `src/shared/errors/app-error.ts` — do not create a new one.
- **No Express, no Prisma imports in this file.**

### `sources.controller.ts`

- Arrow-function handlers, same shape as `villages.controller.ts`.
- Use `schema.safeParse(req.query)` / `safeParse(req.params)`. On failure, throw the existing `ValidationError` with `details: [{ field, issue }]`.
- Respond `{ data, meta }` for list, `{ data }` for detail.
- No business logic — just validate, call service, respond.

### `sources.routes.ts`

```typescript
export function createSourcesRouter(controller: SourcesController) {
  const router = Router();
  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  return router;
}
```

### `sources.service.spec.ts`

Jasmine tests, no DB. Fake the repository. Cover:

1. `list` computes `skip`/`take` correctly for page 1
2. `list` computes `skip`/`take` correctly for page 3
3. `list` totalPages is `0` when totalItems is `0`
4. `list` totalPages is `1` when totalItems is 1 and pageSize is 20
5. `list` totalPages is `2` when totalItems is 21 and pageSize is 20
6. `getById` returns the source from the repository
7. `getById` throws `NotFoundError` when the repository returns null
8. Schemas: `pageSize: 101` rejected
9. Schemas: `page: 0` rejected
10. Schemas: invalid `id` (e.g. `abc`, `-1`, `0`) rejected
11. Schemas: defaults apply (`page: 1`, `pageSize: 20`)

## Step 4 — Wire it

Edit `src/container.ts`:
- Construct `PrismaSourcesRepository`, `SourcesService`, `SourcesController`
- Export them

Edit `src/app.ts`:
- Import `createSourcesRouter`
- Mount at `/api/v1/sources` **above** `notFoundHandler`

**Heads-up:** both `container.ts` and `app.ts` will also be touched by Mah and Hos. If you get a merge conflict, the resolution is simple: both changes to `app.ts` are independent `app.use(...)` lines, keep both. In `container.ts`, the two blocks of exports are independent, keep both. If unsure, ping Ahmad.

## Step 5 — DEV seed (optional)

If you want real data to test against, create `seed/dev-sample-sources.sql`:

- DEV ONLY comment at the top
- Idempotent (use `ON CONFLICT DO NOTHING`)
- Include `created_at` and `updated_at` explicitly with `now()` — **the DB requires them** on any new row (this was a bug we hit in the villages seed)
- 3–4 fake sources with fictional titles, authors, and years

Run it:

```bash
docker compose exec -T db psql -U qaryati -d qaryati < seed/dev-sample-sources.sql
```

Run it twice to prove idempotency.

## Step 6 — Verify (run every one of these, show real output)

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx prisma migrate status
```

All must pass. Then start the server:

```bash
set -a; . ./.env; set +a
npm run dev
```

In a second terminal (or Postman):

```bash
curl -sS 'http://localhost:3000/api/v1/sources'
curl -sS 'http://localhost:3000/api/v1/sources?type=book'
curl -sS 'http://localhost:3000/api/v1/sources?pageSize=2&page=2'
curl -sS -i 'http://localhost:3000/api/v1/sources/1'
curl -sS -i 'http://localhost:3000/api/v1/sources/99999'   # must be 404
curl -sS -i 'http://localhost:3000/api/v1/sources/abc'     # must be 400
curl -sS -i 'http://localhost:3000/api/v1/sources?pageSize=500'  # must be 400
```

Paste all outputs into the PR description.

## Step 7 — Open the PR

Use the repo's PR template. Base: `main`. Title: `feat(sources): add read-only sources slice`.

In "Design decisions" include:
- Whether Source has a status column, and why your filtering (or lack of it) is correct
- Your default sort order and why
- Any conflict you had to resolve with Mah or Hos's branches on `container.ts` / `app.ts`

In "How it was tested" tick:
- Unit tests added — yes
- Integration tests — no (repo has no harness)
- Manually verified — paste the curl outputs

Then assign Ahmad as reviewer.

## Common mistakes to avoid

- **Letting a `BigInt` reach JSON.** `res.json({ id: 1n })` throws. Convert in the prisma repo: `id: Number(row.id)`.
- **Importing Prisma types in the service.** `import type { Source } from '@prisma/client'` in `sources.service.ts` is forbidden. Use your own domain types.
- **Total pages when empty.** `Math.ceil(0 / 20)` = 0. Correct. If you write `(totalItems / pageSize) | 0 + 1` you'll be off by one everywhere.
- **`Number.isInteger` on parsed numbers.** Use `z.number().int()` in Zod — don't hand-roll.
- **Forgetting `updated_at` in the seed.** The DB has no default on `updated_at` (only `@updatedAt` at the Prisma-client level). Raw SQL inserts must supply it.