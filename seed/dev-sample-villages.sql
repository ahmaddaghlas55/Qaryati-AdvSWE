-- DEV ONLY: fake sample data for local development.
-- These names and villages are fictional and must be replaced by the real seed script.

INSERT INTO governorates (slug, name_ar, name_en)
VALUES
  ('nablus', 'نابلس', 'Nablus'),
  ('ramallah-and-al-bireh', 'رام الله والبيرة', 'Ramallah and Al-Bireh'),
  ('jenin', 'جنين', 'Jenin')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO app_users (email, password_hash, role)
VALUES ('dev@example.com', 'not-a-working-password-hash', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO villages (
  slug, governorate_id, municipality, overview, status, created_by, created_at, updated_at
)
SELECT
  sample.slug,
  g.id,
  sample.municipality,
  sample.overview,
  sample.status,
  u.id,
  now(),
  now()
FROM (VALUES
  ('sunrise-hollow', 'nablus', 'Sunrise Municipality', 'Fictional verified village one.', 'verified'),
  ('olive-cloud', 'nablus', 'Olive Municipality', 'Fictional verified village two.', 'verified'),
  ('stone-meadow', 'ramallah-and-al-bireh', 'Stone Municipality', 'Fictional verified village three.', 'verified'),
  ('hidden-spring', 'jenin', 'Spring Municipality', 'Fictional proposed village hidden from public reads.', 'proposed')
) AS sample(slug, governorate_slug, municipality, overview, status)
JOIN governorates g ON g.slug = sample.governorate_slug
CROSS JOIN (SELECT id FROM app_users WHERE email = 'dev@example.com') u
ON CONFLICT (slug) DO NOTHING;

INSERT INTO village_names (
  village_id, value, language, type, is_current, status, created_by, created_at, updated_at
)
SELECT v.id, names.value, names.language, 'official', TRUE, 'verified', u.id, now(), now()
FROM (VALUES
  ('sunrise-hollow', 'قرية شروق الوادي', 'ar'),
  ('sunrise-hollow', 'Sunrise Hollow', 'en'),
  ('olive-cloud', 'قرية سحابة الزيتون', 'ar'),
  ('olive-cloud', 'Olive Cloud', 'en'),
  ('stone-meadow', 'قرية مرج الحجر', 'ar'),
  ('stone-meadow', 'Stone Meadow', 'en'),
  ('hidden-spring', 'قرية عين مخفية', 'ar'),
  ('hidden-spring', 'Hidden Spring', 'en')
) AS names(slug, value, language)
JOIN villages v ON v.slug = names.slug
CROSS JOIN (SELECT id FROM app_users WHERE email = 'dev@example.com') u
ON CONFLICT DO NOTHING;
