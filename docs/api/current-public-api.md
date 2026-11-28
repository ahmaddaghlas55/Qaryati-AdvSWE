# Current public API

This document inventories only endpoints that are currently exposed by the checked-out application. It does not describe authentication, write, review, population, event, geocoding, or cache endpoints that are not mounted.

Base URL:

```text
/api/v1
```

The API runs on port `3000` locally.

## Conventions

List endpoints return:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

Paginated endpoints default to `page=1` and `pageSize=20`. The maximum `pageSize` is `100`.

Errors use:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": [],
    "requestId": "uuid",
    "timestamp": "2026-11-28T17:48:43.107Z"
  }
}
```

Validation errors use status `400` and code `VALIDATION_ERROR`. Missing public resources use status `404` and code `NOT_FOUND`. A missing `X-Request-Id` header generates a UUID; the response includes `X-Request-Id`.

## Governorates

### `GET /api/v1/governorates`

Returns all governorates.

```bash
curl -sS 'http://localhost:3000/api/v1/governorates'
```

```json
{
  "data": [
    {
      "slug": "nablus",
      "nameAr": "نابلس",
      "nameEn": "Nablus"
    }
  ]
}
```

### `GET /api/v1/governorates/:slug`

Returns one governorate. Unknown slugs return `404`.

```bash
curl -sS 'http://localhost:3000/api/v1/governorates/nablus'
```

```json
{
  "data": {
    "slug": "nablus",
    "nameAr": "نابلس",
    "nameEn": "Nablus"
  }
}
```

### `GET /api/v1/governorates/:slug/villages`

Returns verified, non-deleted villages in a governorate.

Query parameters:

| Parameter  | Default | Allowed             |
| ---------- | ------: | ------------------- |
| `page`     |     `1` | integer >= 1        |
| `pageSize` |    `20` | integer 1-100       |
| `sort`     |  `slug` | `slug`, `updatedAt` |
| `order`    |   `asc` | `asc`, `desc`       |

An unknown governorate returns `404`. A known governorate with no public villages returns `200` with an empty page.

```bash
curl -sS 'http://localhost:3000/api/v1/governorates/nablus/villages'
```

```json
{
  "data": [
    {
      "slug": "olive-cloud",
      "name": {
        "ar": "قرية سحابة الزيتون",
        "en": "Olive Cloud"
      },
      "municipality": "Olive Municipality",
      "updatedAt": "2026-10-02T14:21:47.293Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

## Villages

### `GET /api/v1/villages`

Returns public village summaries where `status=verified` and `deletedAt IS NULL`.

Query parameters:

| Parameter     | Default | Allowed                    |
| ------------- | ------: | -------------------------- |
| `page`        |     `1` | integer >= 1               |
| `pageSize`    |    `20` | integer 1-100              |
| `governorate` | omitted | lowercase governorate slug |
| `sort`        |  `slug` | `slug`, `updatedAt`        |
| `order`       |   `asc` | `asc`, `desc`              |

For `sort=updatedAt`, equal timestamps are ordered by `slug ASC` as a deterministic secondary key. The guarantee applies to a fixed dataset; offset pagination can still shift when records are concurrently inserted or updated.

```bash
curl -sS 'http://localhost:3000/api/v1/villages?sort=updatedAt&order=desc&page=1&pageSize=20'
```

```json
{
  "data": [
    {
      "slug": "olive-cloud",
      "name": {
        "ar": "قرية سحابة الزيتون",
        "en": "Olive Cloud"
      },
      "governorate": {
        "slug": "nablus",
        "nameAr": "نابلس",
        "nameEn": "Nablus"
      },
      "municipality": "Olive Municipality",
      "updatedAt": "2026-10-02T14:21:47.293Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 3,
    "totalPages": 1
  }
}
```

### `GET /api/v1/villages/:slug`

Returns public detail for one verified, non-deleted village. Proposed or deleted villages return `404`.

```bash
curl -sS 'http://localhost:3000/api/v1/villages/sunrise-hollow'
```

```json
{
  "data": {
    "slug": "sunrise-hollow",
    "name": {
      "ar": "قرية شروق الوادي",
      "en": "Sunrise Hollow"
    },
    "governorate": {
      "slug": "nablus",
      "nameAr": "نابلس",
      "nameEn": "Nablus"
    },
    "municipality": "Sunrise Municipality",
    "updatedAt": "2026-10-02T14:21:47.293Z",
    "overview": "Fictional verified village one.",
    "elevationM": null,
    "areaKm2": null
  }
}
```

### `GET /api/v1/villages/:slug/names`

Returns current verified names for a public village.

```bash
curl -sS 'http://localhost:3000/api/v1/villages/sunrise-hollow/names'
```

```json
{
  "data": [
    {
      "id": 4,
      "language": "ar",
      "type": "official",
      "value": "قرية شروق الوادي",
      "isCurrent": true,
      "validFrom": null,
      "validTo": null,
      "meaningOrOrigin": null
    }
  ]
}
```

Unknown or non-public villages return `404`. A public village with no matching names returns `200` with `{"data":[]}`.

### `GET /api/v1/villages/:slug/names/history`

Returns non-deleted name records with status `verified` or `superseded` for a public village.

```bash
curl -sS 'http://localhost:3000/api/v1/villages/sunrise-hollow/names/history'
```

The name item shape is the same as the current-names endpoint:

```json
{
  "data": [
    {
      "id": 4,
      "language": "ar",
      "type": "official",
      "value": "قرية شروق الوادي",
      "isCurrent": true,
      "validFrom": null,
      "validTo": null,
      "meaningOrOrigin": null
    }
  ]
}
```

## Sources

### `GET /api/v1/sources`

Returns sources sorted by `title ASC`, then `id ASC`.

Query parameters:

| Parameter         | Default | Allowed                           |
| ----------------- | ------: | --------------------------------- |
| `page`            |     `1` | integer >= 1                      |
| `pageSize`        |    `20` | integer 1-100                     |
| `type`            | omitted | string, maximum 50 characters     |
| `publicationYear` | omitted | integer 1800 through current year |

```bash
curl -sS 'http://localhost:3000/api/v1/sources?type=book&publicationYear=1987'
```

```json
{
  "data": [
    {
      "id": 3,
      "title": "The Lanterns of Dawn",
      "type": "book",
      "publicationYear": 1987,
      "author": "Mira Nasser",
      "updatedAt": "2026-11-21T17:28:57.374Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

Sources currently have no moderation status or `deletedAt` field.

### `GET /api/v1/sources/:id`

Returns one source by numeric ID. Unknown or invalid IDs use `404` or `400` respectively.

```bash
curl -sS 'http://localhost:3000/api/v1/sources/1'
```

```json
{
  "data": {
    "id": 1,
    "title": "A Map of Imaginary Springs",
    "type": "map",
    "publicationYear": 2004,
    "author": "Tariq Salem",
    "updatedAt": "2026-11-21T17:28:57.374Z",
    "publisher": "Fictional Atlas Press",
    "url": "https://example.com/sources/imaginary-springs"
  }
}
```

## Representative invalid responses

Invalid pagination or sorting:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "page",
        "issue": "Too small: expected number to be >=1"
      }
    ],
    "requestId": "uuid",
    "timestamp": "2026-11-28T17:48:42.374Z"
  }
}
```

Unknown resource:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Source not found",
    "details": [],
    "requestId": "uuid",
    "timestamp": "2026-11-28T17:48:44.275Z"
  }
}
```
