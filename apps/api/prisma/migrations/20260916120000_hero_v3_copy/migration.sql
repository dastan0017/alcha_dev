-- AlterTable
ALTER TABLE "HomeContentTranslation" DROP COLUMN "trustLine",
ADD COLUMN     "heroSubtitleMobile" TEXT NOT NULL DEFAULT '';
