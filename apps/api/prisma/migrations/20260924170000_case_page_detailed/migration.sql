-- Detailed case page (/works/alcha-dev): the site, editing texts and photos, and requests.
-- Captions are per-locale and pictures are not, so each picture list has a caption list
-- beside it in ProjectTranslation at the same index; the CRM edits both in one control.

-- `screenshots` becomes `[{ src, device }]`. Every existing row is empty, so the old
-- text[] is simply dropped rather than mapped.
ALTER TABLE "Project" DROP COLUMN "screenshots";
ALTER TABLE "Project" ADD COLUMN "screenshots" JSONB NOT NULL DEFAULT '[]';

ALTER TABLE "Project" ADD COLUMN "shareImage" TEXT;
ALTER TABLE "Project" ADD COLUMN "editingImages" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Project" ADD COLUMN "requestsImage" TEXT;
ALTER TABLE "Project" ADD COLUMN "nextProjectId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Project" ADD COLUMN "durationWeeks" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Project" ADD COLUMN "launchedAt" TEXT NOT NULL DEFAULT '';

ALTER TABLE "ProjectTranslation" ADD COLUMN "siteFeatures" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "ProjectTranslation" ADD COLUMN "screenshotCaptions" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ProjectTranslation" ADD COLUMN "editingTitle" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ProjectTranslation" ADD COLUMN "editingLead" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ProjectTranslation" ADD COLUMN "editingPoints" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "ProjectTranslation" ADD COLUMN "editingCaptions" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ProjectTranslation" ADD COLUMN "requestsTitle" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ProjectTranslation" ADD COLUMN "requestsLead" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ProjectTranslation" ADD COLUMN "requestsPoints" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "ProjectTranslation" ADD COLUMN "requestsStatuses" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ProjectTranslation" ADD COLUMN "requestsCaption" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ProjectTranslation" ADD COLUMN "proofLine" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ProjectTranslation" ADD COLUMN "reliability" JSONB NOT NULL DEFAULT '[]';
