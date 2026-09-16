import { z } from 'zod';

export const hobbyCardSchema = z.object({
  id: z.string(),
  sortOrder: z.number(),
  handle: z.string(),
  url: z.string(),
  imageUrl: z.string().nullable(),
  title: z.string(),
  description: z.string(),
});
export type HobbyCard = z.infer<typeof hobbyCardSchema>;
