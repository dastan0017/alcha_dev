import { z } from 'zod';
import { serviceSchema } from './service';
import { projectSchema } from './project';
import { pricingPlanSchema } from './pricing';
import { siteSettingsSchema } from './settings';
import { homeContentSchema } from './home';
import { aboutProfileSchema } from './about';
import { experienceSchema } from './experience';
import { stackCategorySchema } from './stack';
import { hobbyCardSchema } from './hobby';
import { seoMetaSchema } from './seo';
import { aboutSectionKeySchema, homeSectionKeySchema } from './enums';

/** Shape of GET /content/home?locale= — everything the homepage renders. */
export const homeResponseSchema = z.object({
  content: homeContentSchema,
  /** Sections the owner hid in the visual editor (absent = none hidden). */
  hiddenSections: z.array(homeSectionKeySchema).default([]),
  services: z.array(serviceSchema),
  projects: z.array(projectSchema),
  pricingPlans: z.array(pricingPlanSchema),
  settings: siteSettingsSchema,
  seo: seoMetaSchema,
});
export type HomeResponse = z.infer<typeof homeResponseSchema>;

/** The reusable dark CTA banner block (sourced from HomeContent). */
export const ctaBannerSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  telegramLabel: z.string(),
  cvLabel: z.string(),
});
export type CtaBanner = z.infer<typeof ctaBannerSchema>;

/** Shape of GET /content/about?locale= — everything the About page renders. */
export const aboutResponseSchema = z.object({
  profile: aboutProfileSchema,
  /** Sections the owner hid in the visual editor (absent = none hidden). */
  hiddenSections: z.array(aboutSectionKeySchema).default([]),
  experiences: z.array(experienceSchema),
  projects: z.array(projectSchema),
  stack: z.array(stackCategorySchema),
  hobbies: z.array(hobbyCardSchema),
  cta: ctaBannerSchema,
  settings: siteSettingsSchema,
  seo: seoMetaSchema,
});
export type AboutResponse = z.infer<typeof aboutResponseSchema>;
