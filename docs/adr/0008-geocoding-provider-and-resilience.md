# ADR-0008: Geocoding provider and resilience

- **Status:** Deferred
- **Date:** 2026-11-27
- **Deciders:** None recorded
- **Related decisions:** #21, #22, #23, #24, #25

## Context

The course specification requires an external API integration that can tolerate timeouts and failures, defines retry behavior, respects provider rate limits, and keeps provider-specific details behind an abstraction. `TeamDecisions.md` leaves provider, timeout, retry, rate-limit, and cache decisions open. The starter guide proposes Nominatim and describes resilience requirements, but those proposals do not establish team agreement.

## Decision

No provider or resilience policy is finalized in `TeamDecisions.md`. The provider-abstraction interface is **Not yet verified**. The 1 request/second throttle is process-local; multi-instance deployments are not covered. Treat provider selection, timeout and failure behavior, retry policy, rate limiting, and geocoding cache policy as unresolved.

## Alternatives considered

None recorded as agreed or rejected in `TeamDecisions.md`. The starter guide mentions OpenStreetMap Nominatim as a proposal, not a confirmed provider.

## Consequences

Until the team selects an approach, no implementation should assume a provider, retry strategy, or shared rate-limit mechanism. A process-local throttle cannot coordinate request rates across multiple API instances.

## Implementation status

Known gap: `src/integrations/geocoding/` contains only a placeholder; no provider abstraction, adapter, timeout/retry behavior, or throttle was verified in code.

## Open questions

- The spec requires the external API to handle timeouts and failures, define retry behaviour, respect rate limits, and keep provider details behind an abstraction. Record the provider-abstraction interface as "Not yet verified." The 1 request/second throttle is process-local; state that multi-instance deployments are not covered.
- Which provider, timeout and failure behavior, retry policy, rate-limit mechanism, and cache policy will the team select?
