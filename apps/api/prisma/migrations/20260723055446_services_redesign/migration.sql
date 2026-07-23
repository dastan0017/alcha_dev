-- AlterTable
ALTER TABLE "HomeContentTranslation" ADD COLUMN     "servicesEyebrow" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "servicesLede" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "servicesSecondaryLabel" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ServiceTranslation" ADD COLUMN     "badge" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "bullets" TEXT[],
ADD COLUMN     "techLine" TEXT NOT NULL DEFAULT '';
