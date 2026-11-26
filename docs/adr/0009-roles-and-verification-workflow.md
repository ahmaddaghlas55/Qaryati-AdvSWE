# ADR-0009: Roles and verification workflow

- **Status:** Deferred
- **Date:** 2026-11-27
- **Deciders:** None recorded
- **Related decisions:** #11, #12, #13, #14

## Context

The product needs to define who may create, edit, verify, and remove sourced information, and what happens to records during review. `TeamDecisions.md` marks roles, permissions, verification flow, and removal rules as open. The course guide describes a proposed contributor/reviewer/admin workflow, but the team decision record does not confirm it.

## Decision

No role names, permission matrix, verification transitions, or removal/restore policy are finalized in `TeamDecisions.md`. The role matrix is a product decision, not a Git merge rule.

## Alternatives considered

The team decision table gives example role names but records no selected role model or rejected alternative.

## Consequences

Authorization behavior cannot be safely derived from examples or repository merge permissions. Until the product matrix is agreed, modules must not infer who may perform a domain action.

## Implementation status

Known gap: `src/modules/auth/` is a placeholder and no role-authorization middleware or verification workflow was found. The `AppUser` schema has a role field, but that alone does not establish a permission policy.

## Open questions

- Authorization and merge policy are different things. Do not mix them. Record the role matrix as a product decision, not as the Git merge rule.
- Which roles and permissions apply to creating, editing, verifying, and removing each data type?
- What status transitions and review steps define the verification workflow?
- Who may soft-delete or restore records?
