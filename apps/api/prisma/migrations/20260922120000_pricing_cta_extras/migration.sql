-- Pricing cards get their own button text («Обсудить лендинг») instead of sharing the header's
-- «Обсудить проект», and an optional list of add-ons shown after the features with a «+».

-- AlterTable
ALTER TABLE "PricingPlanTranslation" ADD COLUMN     "ctaLabel" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "extras" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- The button label is required, so existing plans keep the text they showed until now: the
-- header label of the chrome singleton (the oldest row, as the tree repository reads it).
UPDATE "PricingPlanTranslation" AS plan
SET "ctaLabel" = chrome."navCta"
FROM "SiteChromeTranslation" AS chrome
WHERE chrome."locale" = plan."locale"
  AND chrome."siteChromeId" = (SELECT "id" FROM "SiteChrome" ORDER BY "createdAt" LIMIT 1);

-- A visual-editor draft is parsed strictly, so its plans (in `tree` and `base`) need both keys too.
CREATE FUNCTION pg_temp.with_plan_cta(t JSONB) RETURNS JSONB
LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_set(
    t,
    '{pricing}',
    COALESCE(
      (SELECT jsonb_agg(
                plan
                || jsonb_build_object('ru', (plan -> 'ru') || jsonb_build_object(
                     'extras', '[]'::JSONB,
                     'ctaLabel', COALESCE(t #> '{chrome,ru,navCta}', '""'::JSONB)))
                || jsonb_build_object('en', (plan -> 'en') || jsonb_build_object(
                     'extras', '[]'::JSONB,
                     'ctaLabel', COALESCE(t #> '{chrome,en,navCta}', '""'::JSONB)))
                ORDER BY position)
         FROM jsonb_array_elements(t -> 'pricing') WITH ORDINALITY AS item(plan, position)),
      '[]'::JSONB
    )
  )
$$;

UPDATE "ContentDraft"
SET "tree" = pg_temp.with_plan_cta("tree"),
    "base" = pg_temp.with_plan_cta("base");

DROP FUNCTION pg_temp.with_plan_cta(JSONB);
