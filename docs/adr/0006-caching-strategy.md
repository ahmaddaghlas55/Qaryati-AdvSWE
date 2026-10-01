# ADR-0006: Cache behind an interface

## Context

Public verified village reads, static lookups, geocoder responses, and possibly popular searches may benefit from caching, while authenticated and review data must remain fresh.

## Decision

Start with an in-memory LRU implementation behind the `Cache` interface. Cache only public verified data, near-static lookups, geocoder responses, and measured search hot spots. Do not cache authenticated responses, proposed data, review queues, audit logs, or writes.

## Alternatives considered

Redis provides shared cache state but adds an operational dependency before load testing demonstrates the need. No cache would miss the assignment's planned abstraction and performance experiment.

## Consequences

The cache is simple and swappable. Multiple API instances will not share entries until a Redis adapter is added, and invalidation must be tied to verified fact changes.
