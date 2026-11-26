# Architecture Decision Records

Purpose: record significant technical decisions, their context, and their trade-offs, so the team and reviewers can see why the system is built the way it is.

| ADR | Title | Status |
|---|---|---|
| [0001](0001-tech-stack.md) | Technology stack | Accepted |
| [0002](0002-modular-monolith.md) | Modular monolith | Accepted |
| [0004](0004-append-only-audit-log.md) | Database-enforced append-only audit log | Accepted |
| [0005](0005-orm-choice.md) | Prisma and raw SQL policy | Accepted |
| [0006](0006-caching-strategy.md) | Cache behind an interface | Accepted |
| [0007](0007-public-historical-name-visibility.md) | Public historical name visibility | Proposed |
| [0008](0008-geocoding-provider-and-resilience.md) | Geocoding provider and resilience | Proposed |
| [0009](0009-roles-and-verification-workflow.md) | Roles and verification workflow | Proposed |
| [0010](0010-authentication-tokens-and-hashing.md) | Authentication tokens and hashing | Proposed |
| [0011](0011-docker-compose-and-local-database-port.md) | Docker Compose and local database port | Proposed |
| [0012](0012-api-documentation-tool.md) | API documentation tool | Proposed |

Numbers are never reused. Superseded decisions stay in the list with their status changed, not deleted.