-- DEV ONLY: fictional sources for local API testing.

INSERT INTO app_users (email, password_hash, role)
VALUES ('dev@example.com', 'not-a-working-password-hash', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO sources (
  title, author, publisher, url, publication_year, type, created_by, created_at, updated_at
)
SELECT
  sample.title,
  sample.author,
  sample.publisher,
  sample.url,
  sample.publication_year,
  sample.type,
  u.id,
  now(),
  now()
FROM (VALUES
  ('The Lanterns of Dawn', 'Mira Nasser', 'Fictional Atlas Press', 'https://example.com/sources/lanterns-dawn', 1987, 'book'),
  ('Olive Routes Survey', 'Samir Haddad', 'North Valley Archive', 'https://example.com/sources/olive-routes', 2004, 'report'),
  ('Stone Village Gazette', 'Layla Mansour', 'Cedar Local Press', 'https://example.com/sources/stone-village-gazette', 1987, 'journal'),
  ('Oral Histories of the High Plain', 'Noor Khalil', 'Maple Heritage Institute', 'https://example.com/sources/high-plain-oral-history', 2019, 'interview'),
  ('A Map of Imaginary Springs', 'Tariq Salem', 'Fictional Atlas Press', 'https://example.com/sources/imaginary-springs', 2004, 'map')
) AS sample(title, author, publisher, url, publication_year, type)
CROSS JOIN (SELECT id FROM app_users WHERE email = 'dev@example.com') u
WHERE NOT EXISTS (
  SELECT 1 FROM sources existing WHERE existing.title = sample.title
)
ON CONFLICT DO NOTHING;
