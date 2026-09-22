-- Replaces the homepage «Услуги» section with «Процесс и услуги»: the Service cards and the
-- services* headings give way to an ordered five-step timeline (ProcessStep) and its copy.

-- CreateTable
CREATE TABLE "ProcessStep" (
    "id" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessStepTranslation" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "from" TEXT NOT NULL DEFAULT '',
    "result" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "ProcessStepTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcessStepTranslation_stepId_locale_key" ON "ProcessStepTranslation"("stepId", "locale");

-- AddForeignKey
ALTER TABLE "ProcessStepTranslation" ADD CONSTRAINT "ProcessStepTranslation_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "ProcessStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "HomeContentTranslation" ADD COLUMN     "processAnnotationLabel" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "processAnnotationText" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "processEyebrow" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "processFromLabel" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "processHeading" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "processMainLabel" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "processPill" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "processResultLabel" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "processSubheading" TEXT NOT NULL DEFAULT '';

-- The section copy (the seed's, with fixed step ids), written below to the content tables and
-- to a stored draft alike. Copy rules to keep when editing it: no promise of leads or Google
-- rankings, no framework names, no Lighthouse scores, no untranslated acronyms in card titles.
CREATE FUNCTION pg_temp.process_copy() RETURNS JSONB
LANGUAGE sql IMMUTABLE AS $$
  SELECT '{
    "home": {
      "ru": {
        "processEyebrow": "ПРОЦЕСС И УСЛУГИ",
        "processHeading": "Понятный план работы над вашим проектом",
        "processSubheading": "Ваше участие нужно только на старте — обсудить бизнес и утвердить макет. Всю техническую часть (скорость, SEO, панель и сервер) я беру на себя и отдаю вам готовый сайт.",
        "processPill": "ОТ 1 ДО 6 НЕДЕЛЬ",
        "processFromLabel": "ОТ ВАС",
        "processResultLabel": "РЕЗУЛЬТАТ",
        "processMainLabel": "ГЛАВНОЕ",
        "processAnnotationLabel": "МОЯ ГЛАВНАЯ СИЛА",
        "processAnnotationText": "Этим занимаюсь лично и глубже всего: моя работа — понятно показать сильные стороны вашего бизнеса и сделать так, чтобы сайт с первых секунд вызывал доверие."
      },
      "en": {
        "processEyebrow": "PROCESS & SERVICES",
        "processHeading": "A clear plan for your project",
        "processSubheading": "You’re only needed at the start — to talk through your business and approve the design. I take on everything technical (speed, SEO, the panel and the server) and hand you a finished website.",
        "processPill": "1 TO 6 WEEKS",
        "processFromLabel": "FROM YOU",
        "processResultLabel": "RESULT",
        "processMainLabel": "KEY STEP",
        "processAnnotationLabel": "MY CORE STRENGTH",
        "processAnnotationText": "I handle this personally and in the most depth: my job is to show your business’s strengths clearly and make the site earn trust from the very first seconds."
      }
    },
    "steps": [
      {
        "id": "step-business-talk",
        "isMain": false,
        "ru": {
          "title": "Разговор о бизнесе",
          "description": "Задаю вопросы о вашем продукте, клиентах и конкурентах. Вместе находим, чем вы сильнее других и почему клиент должен выбрать именно вас. Отсюда и берутся тексты.",
          "from": "1 час времени",
          "result": "Разбор бизнеса и структура страниц"
        },
        "en": {
          "title": "Talking business",
          "description": "I ask about your product, your customers and your competitors. Together we find where you’re stronger than the rest and why a customer should choose you. That’s where the copy comes from.",
          "from": "1 hour of your time",
          "result": "Business breakdown and page structure"
        }
      },
      {
        "id": "step-design-copy",
        "isMain": true,
        "ru": {
          "title": "Дизайн и продающие тексты",
          "description": "Собираю макет и пишу продающие тексты. Правки вносим до утверждения макета.",
          "from": "Примеры сайтов и согласование макета",
          "result": "Макет всех страниц с текстами"
        },
        "en": {
          "title": "Design and sales copy",
          "description": "I put together the design and write copy that sells. We make revisions until the design is approved.",
          "from": "Example sites and design approval",
          "result": "Design of every page, with copy"
        }
      },
      {
        "id": "step-dev-seo",
        "isMain": false,
        "ru": {
          "title": "Разработка и SEO",
          "description": "Переношу утверждённый макет в быстрый код и собираю к нему панель управления. Сайт загружается мгновенно, удобен на телефоне и правильно настроен для Google.",
          "from": "Ничего",
          "result": "Работающий сайт и панель на тестовом адресе"
        },
        "en": {
          "title": "Development and SEO",
          "description": "I turn the approved design into fast code and build the site panel to go with it. The site loads instantly, works well on phones and is set up properly for Google.",
          "from": "Nothing",
          "result": "Working site and panel on a test address"
        }
      },
      {
        "id": "step-panel-training",
        "isMain": false,
        "ru": {
          "title": "Учу управлять сайтом",
          "description": "Созваниваемся, и я показываю панель управления: как поменять текст или цену, заменить фото, добавить карточку или целый раздел. Остаётся короткое видео, чтобы потом вспомнить.",
          "from": "30 минут на созвон",
          "result": "Панель управления, доступы и видеоинструкция"
        },
        "en": {
          "title": "Teaching you to run the site",
          "description": "We get on a call and I walk you through the panel: how to change text or a price, replace a photo, add a card or a whole section. You keep a short video to look back on.",
          "from": "30 minutes for a call",
          "result": "Site panel, logins and a video guide"
        }
      },
      {
        "id": "step-launch-handover",
        "isMain": false,
        "ru": {
          "title": "Запуск и передача прав",
          "description": "Запускаю сайт на вашем домене: на существующем или зарегистрирую новый на вас. Отдаю исходный код, доступы к серверу и все настройки. Дальше сайт сможет вести любой разработчик.",
          "from": "Домен, если он уже есть",
          "result": "Сайт работает, код и все доступы у вас"
        },
        "en": {
          "title": "Launch and handover",
          "description": "I launch the site on your domain — the one you already have, or a new one I register in your name. You get the source code, server access and every setting. From then on, any developer can run the site.",
          "from": "Your domain, if you already have one",
          "result": "The site is live; the code and all access are yours"
        }
      }
    ]
  }'::JSONB
$$;

UPDATE "HomeContentTranslation" AS translation
SET "processEyebrow" = home.strings ->> 'processEyebrow',
    "processHeading" = home.strings ->> 'processHeading',
    "processSubheading" = home.strings ->> 'processSubheading',
    "processPill" = home.strings ->> 'processPill',
    "processFromLabel" = home.strings ->> 'processFromLabel',
    "processResultLabel" = home.strings ->> 'processResultLabel',
    "processMainLabel" = home.strings ->> 'processMainLabel',
    "processAnnotationLabel" = home.strings ->> 'processAnnotationLabel',
    "processAnnotationText" = home.strings ->> 'processAnnotationText'
FROM jsonb_each(pg_temp.process_copy() -> 'home') AS home(locale, strings)
WHERE home.locale = translation."locale"::TEXT;

-- The heading is required: its default only existed to add the column to existing rows.
ALTER TABLE "HomeContentTranslation" ALTER COLUMN "processHeading" DROP DEFAULT;

-- The steps belong to the homepage, so a fresh database stays empty until it is seeded.
-- A stored draft gets the same ids below, so publishing it updates these rows in place.
INSERT INTO "ProcessStep" ("id", "sortOrder", "published", "isMain", "updatedAt")
SELECT node ->> 'id', position - 1, true, (node ->> 'isMain')::BOOLEAN, CURRENT_TIMESTAMP
FROM jsonb_array_elements(pg_temp.process_copy() -> 'steps') WITH ORDINALITY AS item(node, position)
WHERE EXISTS (SELECT 1 FROM "HomeContent");

INSERT INTO "ProcessStepTranslation" ("id", "stepId", "locale", "title", "description", "from", "result")
SELECT step."id" || '-' || locale, step."id", locale,
       translation."title", translation."description", translation."from", translation."result"
FROM "ProcessStep" AS step
JOIN jsonb_array_elements(pg_temp.process_copy() -> 'steps') AS item(node) ON node ->> 'id' = step."id"
CROSS JOIN unnest(enum_range(NULL::"Locale")) AS locale
CROSS JOIN jsonb_to_record(node -> locale::TEXT)
  AS translation("title" TEXT, "description" TEXT, "from" TEXT, "result" TEXT);

-- The new section starts visible, even where the owner had hidden the old one.
UPDATE "HomeContent" SET "hiddenSections" = array_remove("hiddenSections", 'services');

-- A visual-editor draft is parsed strictly, so `tree` and `base` get the same change as the
-- tables: the services keys go, the section copy and the five steps come in.
CREATE FUNCTION pg_temp.with_process(t JSONB) RETURNS JSONB
LANGUAGE sql IMMUTABLE AS $$
  SELECT (t - 'services') || jsonb_build_object(
    'home',
    (t -> 'home')
      || jsonb_build_object('hiddenSections', (t #> '{home,hiddenSections}') - 'services')
      || (SELECT jsonb_object_agg(
                   home.locale,
                   ((t #> ARRAY['home', home.locale])
                      - '{servicesEyebrow,servicesHeading,servicesLede,servicesSecondaryLabel}'::TEXT[])
                     || home.strings)
            FROM jsonb_each(pg_temp.process_copy() -> 'home') AS home(locale, strings)),
    'steps',
    (SELECT jsonb_agg(node || jsonb_build_object('published', true) ORDER BY position)
       FROM jsonb_array_elements(pg_temp.process_copy() -> 'steps') WITH ORDINALITY AS item(node, position))
  )
$$;

UPDATE "ContentDraft"
SET "tree" = pg_temp.with_process("tree"),
    "base" = pg_temp.with_process("base");

DROP FUNCTION pg_temp.with_process(JSONB);

DROP FUNCTION pg_temp.process_copy();

-- DropForeignKey
ALTER TABLE "ServiceTranslation" DROP CONSTRAINT "ServiceTranslation_serviceId_fkey";

-- AlterTable
ALTER TABLE "HomeContentTranslation" DROP COLUMN "servicesEyebrow",
DROP COLUMN "servicesHeading",
DROP COLUMN "servicesLede",
DROP COLUMN "servicesSecondaryLabel";

-- DropTable
DROP TABLE "Service";

-- DropTable
DROP TABLE "ServiceTranslation";
