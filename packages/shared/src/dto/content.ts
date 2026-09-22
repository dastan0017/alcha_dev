import { z } from 'zod';
import { serviceSchema } from './service';
import { projectSchema } from './project';
import { pricingPlanSchema } from './pricing';
import { siteSettingsSchema } from './settings';
import { homeContentSchema } from './home';
import { seoMetaSchema } from './seo';
import { homeSectionKeySchema } from './enums';

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
