# Public API: follow-up fixes

**Status:** open
**Owner:** Ahmad (dug)
**Target:** before 1 December 2026
**Scope:** work that was deferred after the sort fix (PR #16). The sort change itself is done and verified.

Each item says what is wrong, how to check it, and what done looks like. Don't mark an item done until its check passes.

---

## F1. OpenAPI file fails validation

**Problem:** `docs/api/openapi.yaml` fails `npx @redocly/cli lint` with 11 errors and 16 warnings.

**Errors (must fix):**
- Every operation lacks a `security` declaration (11 errors).

**Warnings (fix or accept with a reason):**
- Info object has no `license` field.
- Server URL points to `localhost`.
- Every operation lacks an `operationId` (11 warnings).
- Some operations have no `4XX` response (5 warnings).

**Fix:**
- Add `security: []` at the top level, after `servers:`. Auth is not shipped, so no security scheme is declared.
- Add `license` under `info`. Use the license the team agrees on.
- Add a unique `operationId` under each `get:`: `getHealth`, `getReady`, `listGovernorates`, `getGovernorate`, `listGovernorateVillages`, `listVillages`, `getVillage`, `listVillageNames`, `listVillageNameHistory`, `listSources`, `getSource`.
- For the `4XX` warnings, add a response only where the route really returns that status. Otherwise accept the warning and write why in this file.
- Keep `localhost` if the team accepts it for local use, and record that decision.

**Check:**
```
npx @redocly/cli lint docs/api/openapi.yaml
```

**Done when:** 0 errors, and every remaining warning is either fixed or listed under "Accepted warnings" below.

---

## F2. Postman collection does not exist

**Problem:** The team decision (#33) says Postman is the API workflow. No collection has been created.

**Fix:**
- Create `docs/api/postman/qaryati.postman_collection.json` covering the nine public routes plus `/health` and `/ready`.
- Include one request for each success case and one for each main error case (404, 400).
- Export it from Postman, not a hand-edited file.

**Check:** import the collection into Postman and run it against the API on `localhost:3000`. Every request returns its expected status.

**Done when:** the collection is committed, and the run result is recorded in the PR.

---

## F3. Decision #33 is still open

**Problem:** The course spec requires "API-Dog or an equivalent agreed API documentation." Postman plus OpenAPI is proposed in ADR-0012, not agreed.

**Fix:** Ask the instructor or team to confirm that Postman plus an OpenAPI file satisfies the spec. Record the answer in the decisions register (row 33) and in ADR-0012.

**Done when:** the answer is written in both places, with the date and who confirmed it.

---

## F4. Config startup behaviour is not tested

**Problem:** The brief asked for proof that invalid configuration fails at startup. The agent reported config as "already implemented" without testing it.

**Fix:**
- Run the app with an invalid value, for example `PORT=abc`, and record that it refuses to start with a clear error.
- Run it with a missing required variable, such as `DATABASE_URL`, and record the same.
- Confirm `process.env` is read only in `src/config/`.

**Check:** the two failing startups print an error and exit non-zero. Paste the output.

**Done when:** both outputs are in the PR or the team notes.

---

## F5. Integration tests do not exist

**Problem:** `npm run test:integration` runs, but finds no specs and exits with code 2.

**Fix:** Mahmood owns the test harness. Ask for at least one HTTP test per public route, against the seeded database, once the harness exists.

**Done when:** `npm run test:integration` exits 0 with real specs, or the team records that this is deferred.

---

## F6. Governorate and village list use different transaction patterns

**Problem:** The village list uses `$transaction`, while the governorate list uses `Promise.all`. The team rule says count and page queries run together with `Promise.all`.

**Fix:** Change the village list to `Promise.all` in a small separate PR. Do not mix it into another change.

**Check:** `npm test` and the three API requests still return the same results.

**Done when:** the change is merged on its own, and the village list uses `Promise.all`.

---

## F7. Line endings

**Problem:** Several files were converted between LF and CRLF during edits. Committed files should match the endings in `HEAD`.

**Fix:** Set your editor to LF for this repo, or stop it converting on save. Before each commit, check the diff size.

**Check:**
```
git diff --stat
```

**Done when:** a normal edit shows only the lines that changed.

---

## F8. Self-merged PRs need a recorded answer

**Problem:** PR #14 and PR #16 were merged by the same person who wrote them. The rulebook says only the reviewer merges, and no one merges their own PR.

**Fix:** Record in the decisions register (row 37) who approved and who merged each PR. Agree the team's rule for self-merge, then follow it for the next PR.

**Done when:** row 37 is updated and the team has agreed the rule.

---

## Accepted warnings

Record any warning you accept here, with the reason:

- _(none yet)_
---
###Prompt:
Read docs/todo-public-api-followups.md. Do not edit any code or docs yet.

For each item F1 to F8, do this:
1. Run the "Check" step exactly as written, and paste the real output.
2. Compare the output against the "Done when" line.
3. Report one of: DONE (with evidence), NOT DONE (with what is still wrong), or CANNOT VERIFY (say why).

Rules:
- Do not mark an item DONE without pasting its command output.
- Do not claim a test passed unless you ran it in this session.
- For F2 and F3, which need a person or Postman, report CANNOT VERIFY unless the file or written answer exists.
- For F5, report NOT DONE if test:integration exits non-zero.

At the end, give a single table: item, status, evidence, and what remains.