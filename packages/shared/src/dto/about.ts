import { z } from 'zod';

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
