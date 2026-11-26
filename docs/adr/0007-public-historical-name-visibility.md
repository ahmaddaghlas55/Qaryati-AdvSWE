# ADR-0007: Public historical name visibility

- **Status:** Proposed
- **Date:** 2026-11-27
- **Deciders:** Mah (agreement recorded with confirmation still requested)
- **Related decisions:** #15

## Context

Village names can represent current names and historical versions. The API needs a clear rule for which name records may appear in public history. `TeamDecisions.md` records that Mah agreed to showing `verified` and `superseded` names, but marks the item “agreed (confirm),” so it is not an unqualified team decision.

## Decision

Proposed visibility policy: a public village-name history contains only names with status `verified` or `superseded`; other statuses remain hidden. Confirm this policy with the team before treating it as final.

## Alternatives considered

None recorded in `TeamDecisions.md`.

## Consequences

The proposal preserves approved names and their superseded versions for public historical context, while withholding unreviewed or rejected records. Confirming the policy is required before relying on it as the final product rule.

## Implementation status

Verified in code: `src/modules/villages/villages.names.prisma-repository.ts` filters the history query to `verified` and `superseded` names and excludes soft-deleted rows. This describes current query behavior; it does not confirm team approval of the policy.

## Open questions

- Confirm the #15 visibility policy with the team; `TeamDecisions.md` records it as “agreed (confirm).”
