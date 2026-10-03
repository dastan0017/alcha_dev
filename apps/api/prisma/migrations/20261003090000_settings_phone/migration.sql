-- A public phone number for the footer and the business JSON-LD (`telephone`), which
-- search engines want as visible text, not only inside a wa.me link. An existing
-- row takes the number its WhatsApp link already publishes, so the live site shows
-- it without a manual step; edit or clear it in Настройки.

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "phone" TEXT NOT NULL DEFAULT '';

-- Backfill from https://wa.me/<digits>
UPDATE "SiteSettings"
SET "phone" = '+' || substring("whatsapp" from 'wa\.me/(\d{8,15})')
WHERE "phone" = '' AND "whatsapp" ~ 'wa\.me/\d{8,15}';
