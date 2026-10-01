# ADR-0002: Modular monolith

## Context

Four students need to build related domains in parallel without the operational cost of distributed services.

## Decision

Use one deployable modular monolith. Each module is layered as routes, controllers, services, repository interfaces, and ORM implementations. Dependencies point inward and modules communicate through services.

## Alternatives considered

Microservices would add deployment, networking, and consistency overhead without helping the project goals. A single unstructured application would make ownership and testing boundaries unclear.

## Consequences

Deployment remains simple and transactions are straightforward. The team must protect boundaries in code review and keep the composition root as the wiring point.
