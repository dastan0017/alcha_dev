-- AlterTable
ALTER TABLE "HomeContentTranslation" ADD COLUMN     "worksEyebrow" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "worksLede" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "worksLinkLabel" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "ProjectTranslation" ADD COLUMN     "factsLine" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "typeTag" TEXT NOT NULL DEFAULT '';
