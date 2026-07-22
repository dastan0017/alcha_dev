import { z } from 'zod';

/** Language-neutral site settings (contacts, socials, CV, analytics, address). */
export const siteSettingsSchema = z.object({
  email: z.string(),
  telegram: z.string(),
  whatsapp: z.string(),
  github: z.string(),
  linkedin: z.string(),
  instagram: z.string(),
  cvUrl: z.string(),
  addressLocality: z.string(),
  addressRegion: z.string(),
  addressCountry: z.string(),
  priceRange: z.string(),
  gaId: z.string().nullable(),
  yandexMetrikaId: z.string().nullable(),
});
export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export const siteSettingsUpdateSchema = z.object({
  email: z.string().email(),
  telegram: z.string(),
  whatsapp: z.string(),
  github: z.string(),
  linkedin: z.string(),
  instagram: z.string(),
  cvUrl: z.string(),
  addressLocality: z.string(),
  addressRegion: z.string(),
  addressCountry: z.string(),
  priceRange: z.string(),
  gaId: z.string().nullable().optional(),
  yandexMetrikaId: z.string().nullable().optional(),
});
export type SiteSettingsUpdate = z.infer<typeof siteSettingsUpdateSchema>;
