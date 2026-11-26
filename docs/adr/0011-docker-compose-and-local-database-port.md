# ADR-0011: Docker Compose and local database port

- **Status:** Deferred
- **Date:** 2026-11-27
- **Deciders:** Team agreement on port 5434 confirmed by Ahmad; individual names not recorded
- **Related decisions:** #36

## Context

The team must decide how the local system is started and whether the Docker build runs in CI. `TeamDecisions.md` leaves decision #36 open. Separately, Ahmad confirmed that the team agreed in chat on 2026-11-26 to change the local PostgreSQL host port from 5433 to 5434. The Node version also conflicts across the rulebook, CI, and Dockerfile.

## Decision

The local database host port is 5434, as confirmed by Ahmad from the 2026-11-26 team chat. The broader Docker decision (#36)—including one-command startup and whether the Docker build runs in CI—remains open. The Node version remains unresolved.

## Alternatives considered

None recorded in `TeamDecisions.md`.

## Consequences

Local clients connect to PostgreSQL on host port 5434 while containers use PostgreSQL's internal port 5432. The open Docker and Node questions must be resolved before claiming a single consistent, verified development/deployment procedure.

## Implementation status

Verified in code: `docker-compose.yml` maps host port 5434 to container port 5432. This confirms the configured mapping only; it does not verify the full Docker workflow or resolve the Node-version conflict.

## Open questions

- Port 5434 was agreed in team chat on 2026-11-26 (state the chat evidence only if the user confirms it). Node version is open.
- Node version conflict. The team document says Node 22; `.github/workflows/ci.yml` uses Node 20; the rulebook says Node 20; the Dockerfile uses Node 22. Record as open until one version is chosen and CI, Dockerfile and rulebook match.
- What does decision #36 require for one-command startup, and should the Docker build run in CI?
