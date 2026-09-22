-- Removes the About page: its singleton and collections, the project flag and the labels
-- that pointed at it, its SEO rows, and the Kurabu / Chargers projects it alone showed.

-- A visual-editor draft is parsed strictly, so strip the removed keys from `tree` and `base`
-- (and the deleted projects, which publishing the draft would otherwise re-create).
CREATE FUNCTION pg_temp.without_about(t JSONB, removed_ids TEXT[]) RETURNS JSONB
LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_set(
    (t - 'about' - 'experience' - 'stack' - 'hobbies')
      #- '{home,ru,worksLinkLabel}' #- '{home,en,worksLinkLabel}'
      #- '{chrome,ru,navAbout}' #- '{chrome,en,navAbout}',
    '{projects}',
    COALESCE(
      (SELECT jsonb_agg(project - 'showOnAbout' ORDER BY position)
         FROM jsonb_array_elements(t -> 'projects') WITH ORDINALITY AS item(project, position)
        WHERE NOT (project ->> 'id' = ANY (removed_ids))),
      '[]'::JSONB
    )
  )
$$;

UPDATE "ContentDraft"
SET "tree" = pg_temp.without_about("tree", removed.ids),
    "base" = pg_temp.without_about("base", removed.ids)
FROM (
  SELECT COALESCE(array_agg("id"), ARRAY[]::TEXT[]) AS ids
  FROM "Project"
  WHERE "slug" IN ('kurabu', 'chargers')
) AS removed;

DROP FUNCTION pg_temp.without_about(JSONB, TEXT[]);

-- Translation rows cascade.
DELETE FROM "Project" WHERE "slug" IN ('kurabu', 'chargers');

-- The enum below can only shrink once no row uses 'about'.
DELETE FROM "SeoMeta" WHERE "page" = 'about';

-- AlterEnum
BEGIN;
CREATE TYPE "SeoPage_new" AS ENUM ('home');
ALTER TABLE "SeoMeta" ALTER COLUMN "page" TYPE "SeoPage_new" USING ("page"::text::"SeoPage_new");
ALTER TYPE "SeoPage" RENAME TO "SeoPage_old";
ALTER TYPE "SeoPage_new" RENAME TO "SeoPage";
DROP TYPE "SeoPage_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "ExperienceTranslation" DROP CONSTRAINT "ExperienceTranslation_experienceId_fkey";

-- DropForeignKey
ALTER TABLE "AboutProfileTranslation" DROP CONSTRAINT "AboutProfileTranslation_aboutProfileId_fkey";

-- DropForeignKey
ALTER TABLE "StackCategoryTranslation" DROP CONSTRAINT "StackCategoryTranslation_stackCategoryId_fkey";

-- DropForeignKey
ALTER TABLE "HobbyCardTranslation" DROP CONSTRAINT "HobbyCardTranslation_hobbyCardId_fkey";

-- AlterTable
ALTER TABLE "SiteChromeTranslation" DROP COLUMN "navAbout";

-- AlterTable
ALTER TABLE "HomeContentTranslation" DROP COLUMN "worksLinkLabel";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "showOnAbout";

-- DropTable
DROP TABLE "Experience";

-- DropTable
DROP TABLE "ExperienceTranslation";

-- DropTable
DROP TABLE "AboutProfile";

-- DropTable
DROP TABLE "AboutProfileTranslation";

-- DropTable
DROP TABLE "StackCategory";

-- DropTable
DROP TABLE "StackCategoryTranslation";

-- DropTable
DROP TABLE "HobbyCard";

-- DropTable
DROP TABLE "HobbyCardTranslation";
