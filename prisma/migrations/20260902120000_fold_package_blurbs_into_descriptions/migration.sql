-- The package cards used to render `description` followed by a second sentence
-- that lived in the front-end message catalogue, keyed by slug. That sentence
-- could not be edited from Settings and only existed for the three seeded
-- packages, so cards for newly created packages had a different shape.
--
-- Fold it into the description column (and into each stored translation) so
-- description has exactly one source and staff can edit the whole thing.
--
-- Appends rather than overwrites, and each statement is guarded so a rerun --
-- or a description staff have already edited to include the sentence -- is
-- left alone.

-- landing-page
UPDATE "Package" SET description = description || ' ' || 'Focused, fast, and built around one clear action.'
WHERE slug = 'landing-page' AND description NOT LIKE '%Focused, fast, and built around one clear action.%';

UPDATE "Package" SET translations = jsonb_set(translations, '{de,description}',
  to_jsonb((translations #>> '{de,description}') || ' ' || 'Fokussiert, schnell und auf eine klare Aktion ausgerichtet.'))
WHERE slug = 'landing-page' AND translations #>> '{de,description}' IS NOT NULL
  AND translations #>> '{de,description}' NOT LIKE '%Fokussiert, schnell und auf eine klare Aktion ausgerichtet.%';

UPDATE "Package" SET translations = jsonb_set(translations, '{sq,description}',
  to_jsonb((translations #>> '{sq,description}') || ' ' || 'E fokusuar, e shpejtë dhe e ndërtuar rreth një veprimi të qartë.'))
WHERE slug = 'landing-page' AND translations #>> '{sq,description}' IS NOT NULL
  AND translations #>> '{sq,description}' NOT LIKE '%E fokusuar, e shpejtë dhe e ndërtuar rreth një veprimi të qartë.%';

-- full-website
UPDATE "Package" SET description = description || ' ' || 'Structured for growth, content, and credibility.'
WHERE slug = 'full-website' AND description NOT LIKE '%Structured for growth, content, and credibility.%';

UPDATE "Package" SET translations = jsonb_set(translations, '{de,description}',
  to_jsonb((translations #>> '{de,description}') || ' ' || 'Aufgebaut für Wachstum, Inhalte und Glaubwürdigkeit.'))
WHERE slug = 'full-website' AND translations #>> '{de,description}' IS NOT NULL
  AND translations #>> '{de,description}' NOT LIKE '%Aufgebaut für Wachstum, Inhalte und Glaubwürdigkeit.%';

UPDATE "Package" SET translations = jsonb_set(translations, '{sq,description}',
  to_jsonb((translations #>> '{sq,description}') || ' ' || 'E strukturuar për rritje, përmbajtje dhe besueshmëri.'))
WHERE slug = 'full-website' AND translations #>> '{sq,description}' IS NOT NULL
  AND translations #>> '{sq,description}' NOT LIKE '%E strukturuar për rritje, përmbajtje dhe besueshmëri.%';

-- web-app-build
UPDATE "Package" SET description = description || ' ' || 'Designed around your product and your users.'
WHERE slug = 'web-app-build' AND description NOT LIKE '%Designed around your product and your users.%';

UPDATE "Package" SET translations = jsonb_set(translations, '{de,description}',
  to_jsonb((translations #>> '{de,description}') || ' ' || 'Rund um dein Produkt und deine Nutzer gestaltet.'))
WHERE slug = 'web-app-build' AND translations #>> '{de,description}' IS NOT NULL
  AND translations #>> '{de,description}' NOT LIKE '%Rund um dein Produkt und deine Nutzer gestaltet.%';

UPDATE "Package" SET translations = jsonb_set(translations, '{sq,description}',
  to_jsonb((translations #>> '{sq,description}') || ' ' || 'E dizajnuar rreth produktit dhe përdoruesve të tu.'))
WHERE slug = 'web-app-build' AND translations #>> '{sq,description}' IS NOT NULL
  AND translations #>> '{sq,description}' NOT LIKE '%E dizajnuar rreth produktit dhe përdoruesve të tu.%';
