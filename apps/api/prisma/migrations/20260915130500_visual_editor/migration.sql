-- AlterTable
ALTER TABLE "AboutProfile" ADD COLUMN     "hiddenSections" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "HomeContent" ADD COLUMN     "hiddenSections" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "SiteChrome" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteChrome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteChromeTranslation" (
    "id" TEXT NOT NULL,
    "siteChromeId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "navWorks" TEXT NOT NULL DEFAULT '',
    "navPricing" TEXT NOT NULL DEFAULT '',
    "navAbout" TEXT NOT NULL DEFAULT '',
    "navCta" TEXT NOT NULL DEFAULT '',
    "navCtaShort" TEXT NOT NULL DEFAULT '',
    "footerTagline" TEXT NOT NULL DEFAULT '',
    "footerNavHeading" TEXT NOT NULL DEFAULT '',
    "footerContactsHeading" TEXT NOT NULL DEFAULT '',
    "footerRights" TEXT NOT NULL DEFAULT '',
    "footerMadeIn" TEXT NOT NULL DEFAULT '',
    "viewCaseLabel" TEXT NOT NULL DEFAULT '',
    "allWorksLabel" TEXT NOT NULL DEFAULT '',
    "backToHomeLabel" TEXT NOT NULL DEFAULT '',
    "roleLabel" TEXT NOT NULL DEFAULT '',
    "stackLabel" TEXT NOT NULL DEFAULT '',
    "whatWasDoneLabel" TEXT NOT NULL DEFAULT '',
    "pricingSwipeHint" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "SiteChromeTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentDraft" (
    "id" TEXT NOT NULL DEFAULT 'site',
    "tree" JSONB NOT NULL,
    "base" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteChromeTranslation_siteChromeId_locale_key" ON "SiteChromeTranslation"("siteChromeId", "locale");

-- AddForeignKey
ALTER TABLE "SiteChromeTranslation" ADD CONSTRAINT "SiteChromeTranslation_siteChromeId_fkey" FOREIGN KEY ("siteChromeId") REFERENCES "SiteChrome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SiteChrome singleton: the nav / footer / button labels that lived in apps/web/src/messages/{ru,en}.json
INSERT INTO "SiteChrome" ("id", "updatedAt") VALUES ('site-chrome', CURRENT_TIMESTAMP);

INSERT INTO "SiteChromeTranslation" ("id", "siteChromeId", "locale", "navWorks", "navPricing", "navAbout", "navCta", "navCtaShort", "footerTagline", "footerNavHeading", "footerContactsHeading", "footerRights", "footerMadeIn", "viewCaseLabel", "allWorksLabel", "backToHomeLabel", "roleLabel", "stackLabel", "whatWasDoneLabel", "pricingSwipeHint") VALUES
    ('site-chrome-ru', 'site-chrome', 'ru', 'Работы', 'Цены', 'Обо мне', 'Обсудить проект', 'Обсудить', 'Сайты, CRM и веб-приложения под ключ.', 'Навигация', 'Контакты', 'Все права защищены', 'Бишкек, Кыргызстан', 'Смотреть кейс', 'Работы', 'На главную', 'Роль', 'Стек', 'Что сделано', 'Листайте, чтобы сравнить →'),
    ('site-chrome-en', 'site-chrome', 'en', 'Work', 'Pricing', 'About', 'Discuss a project', 'Discuss', 'Turnkey websites, CRMs and web apps.', 'Navigation', 'Contacts', 'All rights reserved', 'Bishkek, Kyrgyzstan', 'View case', 'Selected work', 'Home', 'Role', 'Stack', 'What was done', 'Swipe to compare →');
