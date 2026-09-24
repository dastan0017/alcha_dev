-- A shipped app's store pages, so the card can link to them instead of claiming
-- «APP STORE + GOOGLE PLAY» in a badge (design «Project Chaban» 1b). Language-neutral:
-- the same two URLs serve both locales, and a blank one hides its link.

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "appStoreUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN "googlePlayUrl" TEXT NOT NULL DEFAULT '';
