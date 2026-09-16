import { z } from 'zod';
import type { Locale } from '../constants/locales';

/** Localized nav / footer / button labels shared by every page (GET /content/chrome?locale=). */
export const siteChromeSchema = z.object({
  navWorks: z.string(),
  navPricing: z.string(),
  navAbout: z.string(),
  navCta: z.string(),
  /** Compact header CTA on narrow screens. */
  navCtaShort: z.string(),
  footerTagline: z.string(),
  footerNavHeading: z.string(),
  footerContactsHeading: z.string(),
  footerRights: z.string(),
  footerMadeIn: z.string(),
  /** Works card link, e.g. "Смотреть кейс". */
  viewCaseLabel: z.string(),
  /** Case-page breadcrumb back to the works list. */
  allWorksLabel: z.string(),
  backToHomeLabel: z.string(),
  roleLabel: z.string(),
  stackLabel: z.string(),
  whatWasDoneLabel: z.string(),
  /** Hint under the pricing carousel on mobile. */
  pricingSwipeHint: z.string(),
});
export type SiteChrome = z.infer<typeof siteChromeSchema>;

/** Seeded labels (migration `20260915130500_visual_editor`); the web fallback and the API seed use them. */
export const DEFAULT_CHROME: Record<Locale, SiteChrome> = {
  ru: {
    navWorks: 'Работы',
    navPricing: 'Цены',
    navAbout: 'Обо мне',
    navCta: 'Обсудить проект',
    navCtaShort: 'Обсудить',
    footerTagline: 'Сайты, CRM и веб-приложения под ключ.',
    footerNavHeading: 'Навигация',
    footerContactsHeading: 'Контакты',
    footerRights: 'Все права защищены',
    footerMadeIn: 'Бишкек, Кыргызстан',
    viewCaseLabel: 'Смотреть кейс',
    allWorksLabel: 'Работы',
    backToHomeLabel: 'На главную',
    roleLabel: 'Роль',
    stackLabel: 'Стек',
    whatWasDoneLabel: 'Что сделано',
    pricingSwipeHint: 'Листайте, чтобы сравнить →',
  },
  en: {
    navWorks: 'Work',
    navPricing: 'Pricing',
    navAbout: 'About',
    navCta: 'Discuss a project',
    navCtaShort: 'Discuss',
    footerTagline: 'Turnkey websites, CRMs and web apps.',
    footerNavHeading: 'Navigation',
    footerContactsHeading: 'Contacts',
    footerRights: 'All rights reserved',
    footerMadeIn: 'Bishkek, Kyrgyzstan',
    viewCaseLabel: 'View case',
    allWorksLabel: 'Selected work',
    backToHomeLabel: 'Home',
    roleLabel: 'Role',
    stackLabel: 'Stack',
    whatWasDoneLabel: 'What was done',
    pricingSwipeHint: 'Swipe to compare →',
  },
};
