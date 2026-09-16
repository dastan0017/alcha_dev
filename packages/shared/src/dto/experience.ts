import { z } from 'zod';

export const experienceSchema = z.object({
  id: z.string(),
  company: z.string(),
  sortOrder: z.number(),
  role: z.string(),
  /** e.g. "авг 2023 — сейчас · 3 года · удалённо · США и Европа" */
  meta: z.string(),
  description: z.string(),
});
export type Experience = z.infer<typeof experienceSchema>;
