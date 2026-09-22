-- Rebuilds the «Цены» cards (design «Pricing Section Options» 1a): every plan says who it is
-- for and names example businesses, its feature list gets a heading that carries the tier
-- ladder («Всё из «Лендинга», плюс:»), optional add-ons take their «По желанию:» prefix from a
-- home label, the meta line carries timing only (payment terms stay in the footnote), and the
-- phone carousel goes, with its swipe hint.

-- AlterTable
ALTER TABLE "HomeContentTranslation" ADD COLUMN     "pricingExamplesLabel" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "pricingOptionalLabel" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "PricingPlanTranslation" ADD COLUMN     "examples" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "listHeading" TEXT NOT NULL DEFAULT '';

-- The approved copy (the seed's), written below to the content tables and to a stored draft
-- alike. The seeded plans are matched by their RU name, which the design keeps. Copy rules to
-- keep when editing it: no promise of leads or Google rankings, optional items never carry a ✓,
-- the badge says who the plan suits (not how popular it is), payment terms only in the footnote.
CREATE FUNCTION pg_temp.pricing_copy() RETURNS JSONB
LANGUAGE sql IMMUTABLE AS $$
  SELECT '{
    "home": {
      "ru": {
        "pricingNote": "Точная смета за 24 часа после первого разговора. Панель для правок входит в любой тариф, CRM — в «Сайт + CRM».",
        "pricingExamplesLabel": "Например:",
        "pricingOptionalLabel": "По желанию:"
      },
      "en": {
        "pricingNote": "A precise quote within 24 hours of our first conversation. The editing panel comes with every plan, the CRM with “Website + CRM”.",
        "pricingExamplesLabel": "For example:",
        "pricingOptionalLabel": "Optional:"
      }
    },
    "listHeading": { "ru": "Что входит:", "en": "What’s included:" },
    "plans": [
      {
        "ru": {
          "name": "Лендинг",
          "priceLabel": "от $300",
          "termLine": "1–2 НЕДЕЛИ",
          "highlightLabel": "",
          "ctaLabel": "Обсудить лендинг",
          "description": "Одно предложение: услуга, товар, курс или событие. Вы приводите людей из рекламы и Instagram, а сайт отвечает на вопросы и превращает интерес в заявку.",
          "examples": "тур, мастер-класс, запуск курса, открытие кафе",
          "listHeading": "Что входит:",
          "features": [
            "Дизайн и продающие тексты",
            "Готов к поиску в Google (SEO): быстро открывается и удобен на телефоне",
            "Заявки приходят в Telegram или WhatsApp",
            "Панель управления (CMS): тексты, цены и фото на сайте меняете сами",
            "Сервер и домен оформляю на вас: все доступы ваши"
          ],
          "extras": []
        },
        "en": {
          "name": "Landing page",
          "priceLabel": "from $300",
          "termLine": "1–2 WEEKS",
          "highlightLabel": "",
          "ctaLabel": "Discuss a landing page",
          "description": "One offer: a service, a product, a course or an event. You bring people in from ads and Instagram, and the site answers their questions and turns interest into a lead.",
          "examples": "a tour, a workshop, a course launch, a café opening",
          "listHeading": "What’s included:",
          "features": [
            "Design and copy that sells",
            "Ready for Google search (SEO): loads fast and is easy to use on a phone",
            "Leads arrive in Telegram or WhatsApp",
            "Site panel (CMS): change the texts, prices and photos on the site yourself",
            "Server and domain registered in your name: all access is yours"
          ],
          "extras": []
        }
      },
      {
        "ru": {
          "name": "Сайт компании",
          "priceLabel": "от $700",
          "termLine": "3–6 НЕДЕЛЬ",
          "highlightLabel": "СОВЕТУЮ КОМПАНИЯМ",
          "ctaLabel": "Обсудить сайт компании",
          "description": "Несколько услуг или товаров, и вы хотите, чтобы клиенты находили вас в Google сами, а не только через рекламу.",
          "examples": "клиника, автосервис, турфирма, гостевой дом",
          "listHeading": "Всё из «Лендинга», плюс:",
          "features": [
            "Отдельная страница под каждую услугу: так её проще найти в Google",
            "Страница о компании и раздел с работами",
            "Сами добавляете новые услуги и кейсы в панели: покажу, как"
          ],
          "extras": [
            "Блог для SEO (оцениваю отдельно)",
            "интернет-магазин с корзиной и оплатой (оцениваю отдельно)"
          ]
        },
        "en": {
          "name": "Company website",
          "priceLabel": "from $700",
          "termLine": "3–6 WEEKS",
          "highlightLabel": "RECOMMENDED FOR COMPANIES",
          "ctaLabel": "Discuss a company website",
          "description": "Several services or products, and you want customers to find you on Google on their own, not only through ads.",
          "examples": "a clinic, a car repair shop, a travel agency, a guesthouse",
          "listHeading": "Everything in “Landing page”, plus:",
          "features": [
            "A separate page for each service, so it’s easier to find on Google",
            "An about page and a portfolio section",
            "Add new services and case studies in the panel yourself: I’ll show you how"
          ],
          "extras": [
            "a blog for SEO (quoted separately)",
            "an online store with a cart and payments (quoted separately)"
          ]
        }
      },
      {
        "ru": {
          "name": "Сайт + CRM",
          "priceLabel": "от $1 500",
          "termLine": "ОТ 6 НЕДЕЛЬ",
          "highlightLabel": "",
          "ctaLabel": "Обсудить сайт с CRM",
          "description": "Заявки приходят с сайта, из Instagram, WhatsApp и Telegram. Вы хотите видеть их в одном окне, чтобы ни одна не потерялась.",
          "examples": "турфирма с менеджерами, учебный центр, салон с онлайн-записью",
          "listHeading": "Всё из «Сайта компании», плюс:",
          "features": [
            "CRM: заявки, клиенты, оплаты и отчёты в одном окне",
            "Заявки из Instagram, WhatsApp и Telegram попадают в CRM",
            "Интеграции: онлайн-оплата и Telegram-бот"
          ],
          "extras": [
            "Мобильное приложение для App Store и Google Play (оцениваю отдельно)"
          ]
        },
        "en": {
          "name": "Website + CRM",
          "priceLabel": "from $1,500",
          "termLine": "FROM 6 WEEKS",
          "highlightLabel": "",
          "ctaLabel": "Discuss a website with a CRM",
          "description": "Leads come in from the site, Instagram, WhatsApp and Telegram. You want to see them in one window so that none of them get lost.",
          "examples": "a travel agency with managers, a training centre, a salon with online booking",
          "listHeading": "Everything in “Company website”, plus:",
          "features": [
            "CRM: leads, clients, payments and reports in one window",
            "Leads from Instagram, WhatsApp and Telegram land in the CRM",
            "Integrations: online payments and a Telegram bot"
          ],
          "extras": [
            "a mobile app for the App Store and Google Play (quoted separately)"
          ]
        }
      }
    ]
  }'::JSONB
$$;

-- An add-on used to spell out its own prefix; the label adds it now.
CREATE FUNCTION pg_temp.without_optional_prefix(extra TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT regexp_replace(extra, '^\s*(По желанию|по желанию|Optional|optional)\s*:\s*', '')
$$;

UPDATE "HomeContentTranslation" AS translation
SET "pricingNote" = home.strings ->> 'pricingNote',
    "pricingExamplesLabel" = home.strings ->> 'pricingExamplesLabel',
    "pricingOptionalLabel" = home.strings ->> 'pricingOptionalLabel'
FROM jsonb_each(pg_temp.pricing_copy() -> 'home') AS home(locale, strings)
WHERE home.locale = translation."locale"::TEXT;

-- Both translation rows of each seeded plan get the approved copy.
UPDATE "PricingPlanTranslation" AS translation
SET "name" = plan #>> ARRAY[translation."locale"::TEXT, 'name'],
    "priceLabel" = plan #>> ARRAY[translation."locale"::TEXT, 'priceLabel'],
    "termLine" = plan #>> ARRAY[translation."locale"::TEXT, 'termLine'],
    "highlightLabel" = plan #>> ARRAY[translation."locale"::TEXT, 'highlightLabel'],
    "ctaLabel" = plan #>> ARRAY[translation."locale"::TEXT, 'ctaLabel'],
    "description" = plan #>> ARRAY[translation."locale"::TEXT, 'description'],
    "examples" = plan #>> ARRAY[translation."locale"::TEXT, 'examples'],
    "listHeading" = plan #>> ARRAY[translation."locale"::TEXT, 'listHeading'],
    "features" = ARRAY(
      SELECT item.value
      FROM jsonb_array_elements_text(plan #> ARRAY[translation."locale"::TEXT, 'features'])
        WITH ORDINALITY AS item(value, position)
      ORDER BY item.position),
    "extras" = ARRAY(
      SELECT item.value
      FROM jsonb_array_elements_text(plan #> ARRAY[translation."locale"::TEXT, 'extras'])
        WITH ORDINALITY AS item(value, position)
      ORDER BY item.position)
FROM "PricingPlanTranslation" AS ru,
     jsonb_array_elements(pg_temp.pricing_copy() -> 'plans') AS approved(plan)
WHERE ru."planId" = translation."planId"
  AND ru."locale" = 'ru'
  AND ru."name" = plan #>> '{ru,name}';

-- Any other plan keeps its copy: its add-ons lose the spelled-out prefix and its list gets the
-- generic heading, which publish requires.
UPDATE "PricingPlanTranslation"
SET "extras" = ARRAY(
      SELECT pg_temp.without_optional_prefix(item.value)
      FROM unnest("extras") WITH ORDINALITY AS item(value, position)
      ORDER BY item.position),
    "listHeading" = pg_temp.pricing_copy() #>> ARRAY['listHeading', "locale"::TEXT]
WHERE "listHeading" = '';

-- A visual-editor draft is parsed strictly, so `tree` and `base` get the same change as the
-- tables: the swipe hint goes, the home labels and every plan's new keys come in.
CREATE FUNCTION pg_temp.with_ladder_plan(plan JSONB) RETURNS JSONB
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN approved IS NOT NULL THEN plan || jsonb_build_object('ru', approved -> 'ru', 'en', approved -> 'en')
    ELSE plan || (
      SELECT jsonb_object_agg(
               copy.locale,
               copy.strings || jsonb_build_object(
                 'examples', COALESCE(copy.strings -> 'examples', '""'::JSONB),
                 'listHeading', CASE
                   WHEN COALESCE(copy.strings ->> 'listHeading', '') = ''
                     THEN pg_temp.pricing_copy() #> ARRAY['listHeading', copy.locale]
                   ELSE copy.strings -> 'listHeading'
                 END,
                 'extras', COALESCE(
                   (SELECT jsonb_agg(pg_temp.without_optional_prefix(item.value) ORDER BY item.position)
                      FROM jsonb_array_elements_text(copy.strings -> 'extras')
                        WITH ORDINALITY AS item(value, position)),
                   '[]'::JSONB)))
        FROM jsonb_each(plan - '{id,published,highlighted}'::TEXT[]) AS copy(locale, strings))
  END
  FROM (
    SELECT (SELECT candidate
              FROM jsonb_array_elements(pg_temp.pricing_copy() -> 'plans') AS item(candidate)
             WHERE candidate #>> '{ru,name}' = plan #>> '{ru,name}') AS approved
  ) AS match
$$;

CREATE FUNCTION pg_temp.with_pricing_ladder(t JSONB) RETURNS JSONB
LANGUAGE sql IMMUTABLE AS $$
  SELECT t || jsonb_build_object(
    'chrome',
    (SELECT jsonb_object_agg(chrome.locale, chrome.strings - 'pricingSwipeHint')
       FROM jsonb_each(t -> 'chrome') AS chrome(locale, strings)),
    'home',
    (t -> 'home')
      || (SELECT jsonb_object_agg(home.locale, (t #> ARRAY['home', home.locale]) || home.strings)
            FROM jsonb_each(pg_temp.pricing_copy() -> 'home') AS home(locale, strings)),
    'pricing',
    COALESCE(
      (SELECT jsonb_agg(pg_temp.with_ladder_plan(plan) ORDER BY position)
         FROM jsonb_array_elements(t -> 'pricing') WITH ORDINALITY AS item(plan, position)),
      '[]'::JSONB)
  )
$$;

UPDATE "ContentDraft"
SET "tree" = pg_temp.with_pricing_ladder("tree"),
    "base" = pg_temp.with_pricing_ladder("base");

DROP FUNCTION pg_temp.with_pricing_ladder(JSONB);

DROP FUNCTION pg_temp.with_ladder_plan(JSONB);

DROP FUNCTION pg_temp.without_optional_prefix(TEXT);

DROP FUNCTION pg_temp.pricing_copy();

-- AlterTable
ALTER TABLE "SiteChromeTranslation" DROP COLUMN "pricingSwipeHint";
