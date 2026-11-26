# ADR-0010: Authentication tokens and hashing

- **Status:** Deferred
- **Date:** 2026-11-27
- **Deciders:** None recorded
- **Related decisions:** #2, #3

## Context

The product will need a secure way to authenticate users, protect stored passwords, and manage session tokens. `TeamDecisions.md` leaves password hashing and token type/lifetime open. The starter guide contains proposals, but those do not establish a team decision.

## Decision

No password-hashing algorithm, token type, access-token lifetime, or refresh-token policy is finalized in `TeamDecisions.md`. Do not treat bcrypt, Argon2, JWT, or token lifetimes as approved choices based solely on proposals or configuration names.

## Alternatives considered

`TeamDecisions.md` names bcrypt and Argon2 as password-hashing options but records no selection or rationale for rejecting either. The token decision has no finalized alternative or rationale recorded.

## Consequences

Authentication implementation and token validation cannot safely proceed on an assumed algorithm or token lifetime. Once selected, the policy must be applied consistently to credential storage, token issuance, refresh, revocation, and configuration.

## Implementation status

Known gap: `src/modules/auth/` is a placeholder and no authentication routes or token-handling service were verified. The schema contains user and refresh-token models, but their presence does not verify the open authentication decisions.

## Open questions

- Which password-hashing algorithm will be selected?
- Which token type and access-token lifetime will be used, and will refresh tokens exist? If so, what are their lifetime, rotation, and revocation rules?
