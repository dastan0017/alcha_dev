import { z } from 'zod';

/** Localized service item as returned by the public API. */
export const serviceSchema = z.object({
  id: z.string(),
  number: z.string(),
  sortOrder: z.number(),
  /** The highlighted "core strength" service, rendered as the large card. */
  featured: z.boolean(),
  title: z.string(),
  description: z.string(),
  /** Pill label on the featured card. */
  badge: z.string(),
  /** Checklist items rendered with ticks. */
  bullets: z.array(z.string()),
  /** Optional mono tech line under the card. */
  techLine: z.string(),
});
export type Service = z.infer<typeof serviceSchema>;
