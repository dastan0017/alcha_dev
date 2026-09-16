import { z } from 'zod';
import type { Locale } from '../constants/locales';

export const leadStatusSchema = z.enum(['new', 'in_progress', 'paid', 'closed']);
export type LeadStatus = z.infer<typeof leadStatusSchema>;
export const LEAD_STATUSES = leadStatusSchema.options;

export const LEAD_STATUS_LABELS: Record<LeadStatus, Record<Locale, string>> = {
  new: { ru: 'новая', en: 'new' },
  in_progress: { ru: 'в работе', en: 'in progress' },
  paid: { ru: 'оплачено', en: 'paid' },
  closed: { ru: 'закрыта', en: 'closed' },
};

/** Colors mirror the CRM leads widget in the design reference. */
export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: '#5B34C9',
  in_progress: '#E8930C',
  paid: '#2E9E5B',
  closed: '#8A8494',
};

export const projectBadgeSchema = z.enum(['work', 'own']);
export type ProjectBadge = z.infer<typeof projectBadgeSchema>;

/** Homepage sections the owner can hide in the visual editor. */
export const homeSectionKeySchema = z.enum(['services', 'works', 'pricing']);
export type HomeSectionKey = z.infer<typeof homeSectionKeySchema>;
export const HOME_SECTION_KEYS = homeSectionKeySchema.options;

/** About-page sections the owner can hide in the visual editor. */
export const aboutSectionKeySchema = z.enum(['experience', 'projects', 'stack', 'hobbies']);
export type AboutSectionKey = z.infer<typeof aboutSectionKeySchema>;
export const ABOUT_SECTION_KEYS = aboutSectionKeySchema.options;

export const userRoleSchema = z.enum(['ADMIN']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const seoPageSchema = z.enum(['home', 'about']);
export type SeoPage = z.infer<typeof seoPageSchema>;
