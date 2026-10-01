# ADR-0004: Database-enforced append-only audit log

## Context

Audit history is an accountability record and must not be silently changed by application code or accidental database operations.

## Decision

The audit log is append-only. PostgreSQL triggers reject update, delete, and truncate operations with the error `audit_log is append-only`; writes occur in the same transaction as the audited change.

## Alternatives considered

Application-only checks are easier to bypass and do not protect against direct database access. Hash chaining is optional future hardening, not a replacement for database enforcement.

## Consequences

Audit history has a strong integrity guarantee. Operational repair requires an explicit administrative database process rather than ordinary update statements.
