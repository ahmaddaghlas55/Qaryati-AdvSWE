# Sources Database Migration

## Migration

`20261024165729_sources_updated_at_type_index`

## Overview

This migration updates the existing `sources` table to support the Sources Read-Only Module.

## Changes

### 1. Added `updated_at`

- Added a non-nullable `updated_at` column with the PostgreSQL type `TIMESTAMPTZ(6)`.
- Existing records receive `CURRENT_TIMESTAMP` as the initial value.
- The Prisma `Source` model uses `@updatedAt` to automatically update this field when records are modified through Prisma Client.
- The API returns this value as an ISO 8601 string.

### 2. Added an index on `type`

- Created the `sources_type_idx` index.
- This index supports queries that filter sources by their type.

## Design Notes

- No `status` or `deleted_at` fields were added because the Sources Read-Only Module does not use the village review or soft-delete workflow.
- Existing migrations were not modified.
- No existing source records were deleted.

## Applying the Migration

```bash
npx prisma migrate deploy
npx prisma generate
```

The migration was applied successfully to the local development database.