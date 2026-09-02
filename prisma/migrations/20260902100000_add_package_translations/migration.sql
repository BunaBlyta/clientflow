-- Per-locale name and description for packages, so staff can edit the German
-- and Albanian copy instead of it living in the front-end code.
ALTER TABLE "Package" ADD COLUMN "translations" JSONB;

-- Backfill the seeded packages with the translations that were previously
-- hardcoded in lib/i18n.tsx, so the German and Albanian pages do not regress
-- to English the moment the front end starts reading this column.
UPDATE "Package" SET "translations" = '{
  "de": {"name": "Landing Page", "description": "Eine einzelne, conversion-starke Seite für einen Launch oder eine Kampagne."},
  "sq": {"name": "Faqe Uljeje", "description": "Një faqe e vetme me konvertim të lartë për një lançim ose fushatë."}
}'::jsonb WHERE "slug" = 'landing-page';

UPDATE "Package" SET "translations" = '{
  "de": {"name": "Komplette Website", "description": "Eine vollständige Marketing-Website mit mehreren Seiten."},
  "sq": {"name": "Faqe e Plotë", "description": "Një faqe marketingu e plotë me shumë nënfaqe."}
}'::jsonb WHERE "slug" = 'full-website';

UPDATE "Package" SET "translations" = '{
  "de": {"name": "Web-App-Entwicklung", "description": "Eine individuelle Web-Anwendung, einzeln abgestimmt."},
  "sq": {"name": "Ndërtim Web App-i", "description": "Një aplikacion web i personalizuar, i përcaktuar veç e veç."}
}'::jsonb WHERE "slug" = 'web-app-build';
