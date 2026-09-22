import { z } from 'zod';

/**
 * Localized step of the homepage «Процесс и услуги» timeline as returned by the public API.
 * The step number («01»…) is not stored: it is the step's position on the page.
 */
export const processStepSchema = z.object({
  id: z.string(),
  sortOrder: z.number(),
  /** The one highlighted step: purple circle and border, badge and the annotation under it. */
  isMain: z.boolean(),
  title: z.string(),
  description: z.string(),
  /** «ОТ ВАС» — what the step needs from the client. */
  from: z.string(),
  /** «РЕЗУЛЬТАТ» — what the step delivers. */
  result: z.string(),
});
export type ProcessStep = z.infer<typeof processStepSchema>;
