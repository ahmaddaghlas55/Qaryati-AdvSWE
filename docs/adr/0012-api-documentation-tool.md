# ADR-0012: API documentation tool

- **Status:** Proposed
- **Date:** 2026-11-27
- **Deciders:** None recorded (proposal only)
- **Related decisions:** #33

## Context

The course specification requires API documentation using API-Dog or an equivalent agreed documentation approach. `TeamDecisions.md` leaves the tool and export location open. Postman plus `docs/api/openapi.yaml` is a proposal, not an agreed decision.

## Decision

Proposed: use Postman for API exploration and keep the API contract in `docs/api/openapi.yaml`. This proposal is not approved; confirm that it satisfies the specification before adopting it.

## Alternatives considered

API-Dog is named by the specification as a possible tool. No reason for preferring Postman or rejecting API-Dog is recorded.

## Consequences

If accepted, the team will need to keep the OpenAPI contract aligned with endpoint behavior and decide how the Postman collection relates to that contract. Until confirmed, neither tool nor file location should be presented as the agreed project standard.

## Implementation status

Known gap: no `docs/api/openapi.yaml` or API documentation directory was found in the repository.

## Open questions

- Confirm with instructor/team that Postman + OpenAPI satisfies the spec
- Where should the exported API contract and Postman collection live, and how will updates be kept in sync?
