-- The CTA banner's second button now opens WhatsApp instead of downloading the CV.
-- The old «Скачать CV ↓» label would be wrong on it, so existing rows get the new label
-- here; the rest of the banner copy reaches the database through the seed.

-- AlterTable
ALTER TABLE "HomeContentTranslation" RENAME COLUMN "ctaCvLabel" TO "ctaWhatsappLabel";

UPDATE "HomeContentTranslation"
SET "ctaWhatsappLabel" = CASE "locale" WHEN 'ru' THEN 'Написать в WhatsApp' ELSE 'Message on WhatsApp' END;

-- A visual-editor draft is parsed strictly, so move the key in `tree` and `base` as well.
CREATE FUNCTION pg_temp.with_whatsapp_label(t JSONB) RETURNS JSONB
LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_set(
    jsonb_set(
      t #- '{home,ru,ctaCvLabel}' #- '{home,en,ctaCvLabel}',
      '{home,ru,ctaWhatsappLabel}', '"Написать в WhatsApp"'
    ),
    '{home,en,ctaWhatsappLabel}', '"Message on WhatsApp"'
  )
$$;

UPDATE "ContentDraft"
SET "tree" = pg_temp.with_whatsapp_label("tree"),
    "base" = pg_temp.with_whatsapp_label("base");

DROP FUNCTION pg_temp.with_whatsapp_label(JSONB);
