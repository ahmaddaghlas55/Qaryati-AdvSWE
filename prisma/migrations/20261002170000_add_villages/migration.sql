CREATE TABLE villages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  governorate_id BIGINT NOT NULL REFERENCES governorates(id),
  municipality TEXT,
  overview TEXT,
  elevation_m DECIMAL(8, 2),
  area_km2 DECIMAL(10, 3),
  status TEXT NOT NULL DEFAULT 'proposed',
  supersedes_id BIGINT REFERENCES villages(id),
  source_id BIGINT REFERENCES sources(id),
  created_by BIGINT NOT NULL REFERENCES app_users(id),
  reviewed_by BIGINT REFERENCES app_users(id),
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT villages_status_check
    CHECK (status IN ('proposed', 'verified', 'disputed', 'rejected', 'superseded'))
);

CREATE INDEX villages_governorate_id_idx ON villages (governorate_id);
CREATE INDEX villages_status_idx ON villages (status);

CREATE TABLE village_names (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  village_id BIGINT NOT NULL REFERENCES villages(id),
  value TEXT NOT NULL,
  value_normalized TEXT,
  language TEXT NOT NULL,
  type TEXT NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  valid_from TEXT,
  valid_to TEXT,
  meaning_or_origin TEXT,
  status TEXT NOT NULL DEFAULT 'proposed',
  supersedes_id BIGINT REFERENCES village_names(id),
  source_id BIGINT REFERENCES sources(id),
  created_by BIGINT NOT NULL REFERENCES app_users(id),
  reviewed_by BIGINT REFERENCES app_users(id),
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT village_names_status_check
    CHECK (status IN ('proposed', 'verified', 'disputed', 'rejected', 'superseded')),
  CONSTRAINT village_names_language_check
    CHECK (language IN ('ar', 'en')),
  CONSTRAINT village_names_type_check
    CHECK (type IN ('official', 'alternative', 'transliteration', 'former', 'historical'))
);

CREATE INDEX village_names_village_id_idx ON village_names (village_id);

CREATE UNIQUE INDEX one_current_official_name
  ON village_names (village_id, language)
  WHERE is_current AND type = 'official' AND status = 'verified' AND deleted_at IS NULL;
