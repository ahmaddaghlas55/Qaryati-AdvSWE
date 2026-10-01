## What changed
<!-- one or two sentences -->

## Why
<!-- link the issue: Closes #123 -->

## Design decisions
<!-- anything a reviewer should know: trade-offs, alternatives rejected, ADR link -->

## How it was tested
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated (if endpoints or DB changed)
- [ ] Manually verified (describe)

## Checklist
- [ ] Follows the layer rules (no business logic in controllers, services don't import framework/ORM types)
- [ ] Input validated, errors use the standard error format
- [ ] Audit entry written for state-changing operations
- [ ] Migration included and reversible (if schema changed)
- [ ] No secrets or debug code committed
- [ ] Docs / OpenAPI updated
