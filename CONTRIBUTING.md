# Contributing to Qaryati

This document is the rulebook. If something here conflicts with what someone told
you verbally, this file wins. If you think a rule should change, open a PR against
this file — don't just ignore it.

Last updated: 2026-10-02

---

## 1. The basics

- **Stack:** Node 20, TypeScript strict, Express 5, Prisma 6.12.0, PostgreSQL,
  Jasmine. Do not change versions. Do not add dependencies without asking.
- **Main branch:** `main`. It is always deployable. It is protected — you cannot
  push directly to it. Every change arrives via a pull request.
- **Reviewer:** Ahmad reviews every PR. No PR merges without his approval.
- **One PR per task.** Do not bundle unrelated changes.

---

## 2. Branching

**Never commit to `main` directly.** Always create a branch.

### Branch naming

```
<type>/<short-slug>
```

| Type | Use for |
|---|---|
| `feature/` | New functionality |
| `fix/` | Bug fixes |
| `docs/` | Documentation only |
| `refactor/` | Code change that neither adds a feature nor fixes a bug |
| `chore/` | Tooling, dependencies, config |

Examples:

```
feature/sources-list
feature/village-names
feature/governorates-extended
fix/pagination-total-pages-zero
docs/week-1-tasks
```

Use lowercase, hyphens (not underscores), no spaces.

### Branch lifecycle

```bash
# Start from an up-to-date main
git checkout main
git pull origin main

# Create your branch
git checkout -b feature/sources-list
```

One branch = one task. When the task is done and merged, delete the branch.

---

## 3. Commit messages

Format:

```
<type>(<scope>): <short description>
```

- **type**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`
- **scope**: the module or area (`villages`, `sources`, `governorates`, `tasks`, `schema`)
- **description**: imperative mood, lowercase, no period, under 72 characters

Good:

```
feat(sources): add paginated list endpoint
fix(villages): return 0 totalPages when no results
docs(tasks): add week 1 assignments
refactor(villages): extract PUBLIC_STATUS constant
```

Bad:

```
update stuff
WIP
fixed the thing
FEAT(SOURCES): Add Paginated List Endpoint.
```

### Rules

- **One logical change per commit.** If you're doing two things, make two commits.
- **Never commit** `node_modules/`, `.env`, `.env.local`, editor temp files,
  `dist/`, or anything from `.gitignore`.
- **Never commit** commented-out code. Delete it — git remembers it for you.
- **Never commit** `console.log` you added for debugging. Remove before committing.
- **Never amend or force-push** a commit that has already been pushed to a shared
  branch. If you need to fix something, make a new commit.

---

## 4. Pull requests

### Before you open a PR, run all of these:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx prisma validate
npx prisma migrate status
```

Every one must pass. If you skipped one, say so in the PR description — do not
claim a check passed if you didn't run it.

### Opening the PR

- **Base branch:** `main`
- **Title:** same format as a commit message, e.g. `feat(sources): add read-only sources slice`
- **Description:** fill in every section of the PR template. Specifically:
  - **What changed** — one or two sentences
  - **Why** — link the task file or issue
  - **Design decisions** — anything a reviewer might question. If you made a choice, explain it.
  - **How it was tested** — paste real command output and real curl/Postman responses.
  - **Checklist** — only tick boxes you actually did. If something is N/A, say so explicitly rather than ticking it.

### What a reviewer looks for

- **Does it work?** They will run your branch, run the tests, hit the endpoints.
- **Does it follow the pattern?** Use `src/modules/villages/` as the reference. Same file layout, same layering.
- **Module boundaries respected?** (See section 6.)
- **Tests cover the tricky cases?** Empty list, not-found, invalid input, pagination edge cases.
- **Git hygiene clean?** Commit messages formatted, no junk files, branch up to date with `main`.

### Merging

- **Only Ahmad merges.** Do not merge your own PR.
- **Squash merge** is the default. The PR title becomes the commit message on `main`.
- **Rebase before merging.** If `main` moved while your PR was open:

  ```bash
  git checkout main
  git pull origin main
  git checkout your-branch
  git rebase main
  # resolve conflicts if any
  git push --force-with-lease
  ```

  `--force-with-lease` is safe. `--force` is never allowed.

- **Delete the branch** after merge (GitHub offers a button).

---

## 5. Tasks and planning

- Every task has a markdown file in `tasks/week-N/`.
- The file is self-contained — the owner should not need to read the other task files.
- When you start a task, create your branch and reference the task in your PR title and description.
- When your PR merges, update the task file with:

  ```markdown
  **Status:** ✅ Done — PR #12 merged 2026-10-15
  ```

- Or move the file to `tasks/done/week-N/`. Pick one convention and stick to it.

**Never delete a task file.** History matters.

---

## 6. Code rules

### Layer rules (non-negotiable)

Each module follows this structure:

```
src/modules/<name>/
  <name>.repository.ts              # interface + plain TS domain types
  <name>.prisma-repository.ts       # ONLY file that imports @prisma/client
  <name>.schemas.ts                 # Zod schemas
  <name>.service.ts                 # business logic — no Express, no Prisma
  <name>.controller.ts              # HTTP boundary — validation + response shaping
  <name>.routes.ts                  # express router
  <name>.service.spec.ts            # unit tests with a fake repository
```

- **`@prisma/client` is imported in exactly one file per module:** the
  `*.prisma-repository.ts`. Nowhere else. Not in services. Not in controllers.
  Not in tests. Not in routes.
- **Prisma types never leave the prisma repository.** Convert `BigInt` → `number`
  and `Decimal` → `number` before returning. If a `BigInt` reaches `res.json()`,
  the response will crash at runtime.
- **Services do not import Express.** No `Request`, `Response`, `NextFunction`,
  `Router`, nothing from `express`. If you need to signal an error, throw a
  domain error (`NotFoundError`, `ValidationError`).
- **Controllers have no business logic.** They validate input with Zod, call the
  service, and shape the response. That's it.
- **Modules never import from other modules' internals.** If `sources` needs
  something from `villages`, redefine the type locally or ask before crossing the
  boundary. Importing another module's service is forbidden.
- **`process.env` is only read from `src/config`.** Nowhere else.

### Response shapes

Follow the villages module exactly:

- **List endpoints:** `{ data: [...], meta: { page, pageSize, totalItems, totalPages } }`
- **Detail endpoints:** `{ data: {...} }`
- **Errors:** always use the shared error format from `src/shared/errors/`.

### Pagination rules

- `page` ≥ 1, default 1
- `pageSize` between 1 and 100, default 20
- `totalPages = Math.ceil(totalItems / pageSize)`
- **When `totalItems = 0`, `totalPages` is 0** — not 1.
- Run the count query and the page query in parallel (`Promise.all`).

### Not-found vs empty

- Repository returns **`null`** → resource doesn't exist → service throws `NotFoundError` → 404.
- Repository returns **`{ items: [], totalItems: 0 }`** → resource exists but has no children → 200 with empty `data`.
- **These are different.** Do not conflate them.

### Database

- **Never run `prisma migrate reset`.** Not on your local DB. Not on anyone's.
- **Never hand-edit a migration** that has already been applied to a shared database.
- If `prisma migrate dev` proposes a reset or reports drift, **stop immediately and
  tell Ahmad.** Do not confirm the reset.
- Every migration must have a clear name: `add_villages`, `villages_updated_at_default`.
- Every migration that adds tables must include the check constraints and indexes
  specified in the guide. Do not rely on Prisma to infer them — it can't express
  partial unique indexes or CHECK constraints.

### Validation

- All input from the outside world (query params, path params, body) is validated
  with Zod `safeParse`. On failure, throw the existing `ValidationError` with
  `details: [{ field, issue }]`.
- Do not hand-roll validation with `if` chains. Use Zod.

### Tests

- Every service gets a `*.service.spec.ts`.
- Tests use a **fake repository** — no database. Jasmine, no network.
- Required coverage per service:
  - Happy path
  - Empty result
  - Not-found
  - Pagination math (including `totalItems = 0`)
  - Every schema rule (defaults apply, invalid values rejected)

Run tests before every push: `npm test`. Do not push failing tests.

---

## 7. What not to do

These are banned without exception. If you think one is necessary, ask first.

- ❌ Push directly to `main`
- ❌ `git push --force` (only `--force-with-lease` is allowed, and only on your own branch)
- ❌ `prisma migrate reset`
- ❌ Commit to someone else's branch
- ❌ Merge your own PR
- ❌ Add, upgrade, or remove a dependency
- ❌ Edit `package.json`, `tsconfig.json`, or `docker-compose.yml` without asking
- ❌ Import `@prisma/client` outside a `*.prisma-repository.ts`
- ❌ Import `express` inside a `*.service.ts`
- ❌ Import from another module's internals
- ❌ Commit `.env`, secrets, API keys, or passwords
- ❌ Commit `node_modules/`, `dist/`, or editor temp files
- ❌ Leave `console.log` or `debugger` statements in committed code
- ❌ Claim a test passed that you didn't run

If you find yourself wanting to break one of these rules because "it's just this one
time," stop and ask. The rules exist because the alternative is a mess six weeks
from now that nobody can untangle.

---

## 8. Communication

- **Ask early.** A five-minute question saves a five-hour refactor. If you're
  unsure about an interface, a data shape, or a rule, ask before writing 200 lines.
- **Ask in writing.** Slack messages, GitHub comments, and PR review threads are
  the record. Verbal decisions get forgotten.
- **Report blockers immediately.** If you're stuck for more than 30 minutes on
  something, say so. Nobody minds; the alternative is silence followed by a missed
  deadline.
- **When you don't know, say so.** "I don't know how to do this yet" is a fine
  answer. Guessing and pretending is not.

---

## 9. The daily workflow (cheat sheet)

```bash
# --- Start of day ---
git checkout main
git pull origin main

# --- Start a task ---
git checkout -b feature/your-feature

# --- Work, commit often ---
git add <specific files>          # never `git add .`
git commit -m "feat(module): short description"

# --- Before pushing, run every check ---
npm run lint
npm run typecheck
npm test
npm run build

# --- Push ---
git push -u origin feature/your-feature

# --- Open a PR on GitHub ---
# Base: main. Title: feat(module): short description.
# Description: fill in every section.

# --- After review, before merge (if main moved) ---
git checkout main
git pull origin main
git checkout feature/your-feature
git rebase main
# resolve conflicts, then:
git push --force-with-lease

# --- After your PR merges ---
git checkout main
git pull origin main
git branch -d feature/your-feature
# update your task file, commit with `docs(tasks): mark <task> done`
```

---

## 10. When something goes wrong

| Situation | What to do |
|---|---|
| Push rejected because main moved | `git pull --rebase origin main`, resolve, push |
| Merge conflict on `container.ts` or `app.ts` | Keep both sides' additions — they're independent. If unsure, ask. |
| `prisma migrate dev` wants to reset | **STOP.** Tell Ahmad. Do not confirm. |
| `migrate status` reports drift | **STOP.** Paste the output to Ahmad. |
| Tests fail on your branch but pass on `main` | Something you changed broke them. `git log -p` since your branch point to find it. |
| You committed to `main` by accident | Do NOT push. `git reset --soft HEAD~1`, create a branch, commit there. |
| You pushed to `main` by accident | Tell Ahmad immediately. Do not try to fix it yourself with force-push. |
| You lost work | `git reflog` — almost nothing in git is truly lost. Ask before doing anything else. |

---

## 11. Reviewer's checklist (for Ahmad)

When reviewing a PR, verify:

- [ ] Task file exists in `tasks/week-N/` and matches what was built
- [ ] PR title follows the commit-message format
- [ ] PR description fills in every template section honestly
- [ ] Branch is up to date with `main`
- [ ] `npm run lint`, `typecheck`, `test`, `build` all pass locally on the branch
- [ ] Endpoints work against a real database (curl/Postman)
- [ ] Layer rules respected (section 6)
- [ ] No `@prisma/client` outside a prisma-repository file
- [ ] No `BigInt` or `Decimal` leaks into the response
- [ ] Tests cover happy path, empty, not-found, pagination edges, schema rules
- [ ] No secrets, no debug code, no junk files
- [ ] Migrations (if any) are clean, well-named, and don't touch unrelated tables
- [ ] Module boundaries not violated

If any item is unchecked, request changes — do not approve "to be nice."

---

## 12. The spirit of the rules

The point is not to make your life hard. It's to make these four things true:

1. **`main` always works.** If you clone it and run it, it runs.
2. **Any change can be traced.** Given a bug, you can find the PR that caused it,
   the review discussion, and the task that asked for it.
3. **Anyone can take over anyone else's work.** The pattern is the same across
   modules. Reading `villages` teaches you how to read `sources` and `governorates`.
4. **Nobody is surprised.** You know what you're allowed to do. Your teammates know
   what to expect from you. Ahmad knows what to review.

Follow the rules when they help. When they hurt, propose a change to this file.
Do not silently ignore them — that's how a project becomes a mess.
