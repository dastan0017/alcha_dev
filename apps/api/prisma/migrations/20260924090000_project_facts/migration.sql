-- The works card drops its mono `factsLine` string for a list of ✓ facts, each an optional
-- bold lead phrase plus the rest of the line (design «Project alcha.dev» 1a). Existing lines
-- were « · »-joined, so each part becomes one lead-less fact and nothing is lost.

-- AlterTable
ALTER TABLE "ProjectTranslation" ADD COLUMN "facts" JSONB NOT NULL DEFAULT '[]';

UPDATE "ProjectTranslation"
SET "facts" = COALESCE(
  (
    SELECT jsonb_agg(jsonb_build_object('text', part) ORDER BY ordinality)
    FROM unnest(string_to_array("factsLine", ' · ')) WITH ORDINALITY AS entry(part, ordinality)
    WHERE btrim(part) <> ''
  ),
  '[]'::jsonb
)
WHERE btrim("factsLine") <> '';

ALTER TABLE "ProjectTranslation" DROP COLUMN "factsLine";
