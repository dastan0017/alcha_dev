import { z } from 'zod';
import { translatedSchema } from './common';

/** About-page hero/profile singleton (localized). */
export const aboutProfileSchema = z.object({
  name: z.string(),
  photoUrl: z.string().nullable(),
  photoCaption: z.string(),
  /** Rich HTML with <strong> highlights. */
  bioHtml: z.string(),
  experienceHeading: z.string(),
  projectsHeading: z.string(),
  stackHeading: z.string(),
  hobbiesHeading: z.string(),
});
export type AboutProfile = z.infer<typeof aboutProfileSchema>;

export const aboutProfileTranslationInput = z.object({
  name: z.string().min(1),
  photoCaption: z.string().default(''),
  bioHtml: z.string().min(1),
  experienceHeading: z.string().min(1),
  projectsHeading: z.string().min(1),
  stackHeading: z.string().min(1),
  hobbiesHeading: z.string().min(1),
});

export const aboutProfileUpdateSchema = z.object({
  photoUrl: z.string().nullable().default(null),
  translations: translatedSchema(aboutProfileTranslationInput),
});
export type AboutProfileUpdate = z.infer<typeof aboutProfileUpdateSchema>;
