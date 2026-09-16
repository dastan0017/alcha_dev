import { z } from 'zod';

export const stackCategorySchema = z.object({
  id: z.string(),
  sortOrder: z.number(),
  title: z.string(),
  /** Item names (React, Next.js, …) are language-neutral. */
  items: z.array(z.string()),
});
export type StackCategory = z.infer<typeof stackCategorySchema>;
