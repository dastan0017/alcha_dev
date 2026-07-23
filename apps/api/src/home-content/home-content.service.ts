import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { CtaBanner, HomeContent, HomeContentUpdate, Locale } from '@alcha/shared';
import { PrismaService } from '../prisma/prisma.service';
import { pickTranslation, LOCALES_TUPLE } from '../common/i18n';

type HomeRow = Prisma.HomeContentGetPayload<{ include: { translations: true } }>;
type HomeTx = HomeRow['translations'][number];

@Injectable()
export class HomeContentService {
  constructor(private readonly prisma: PrismaService) {}

  async get(locale: Locale): Promise<HomeContent> {
    const row = await this.getOrCreate();
    const t = pickTranslation(row.translations, locale);
    return this.toDto(t);
  }

  async getCta(locale: Locale): Promise<CtaBanner> {
    const content = await this.get(locale);
    return {
      title: content.ctaTitle,
      subtitle: content.ctaSubtitle,
      telegramLabel: content.ctaTelegramLabel,
      cvLabel: content.ctaCvLabel,
    };
  }

  async getAdmin(): Promise<HomeContentUpdate> {
    const row = await this.getOrCreate();
    return {
      translations: {
        ru: this.txInput(row.translations, 'ru'),
        en: this.txInput(row.translations, 'en'),
      },
    };
  }

  async update(input: HomeContentUpdate): Promise<HomeContentUpdate> {
    const row = await this.getOrCreate();
    await this.prisma.homeContent.update({
      where: { id: row.id },
      data: {
        translations: {
          upsert: LOCALES_TUPLE.map((locale) => ({
            where: { homeContentId_locale: { homeContentId: row.id, locale } },
            create: { locale, ...input.translations[locale] },
            update: { ...input.translations[locale] },
          })),
        },
      },
    });
    return this.getAdmin();
  }

  private async getOrCreate(): Promise<HomeRow> {
    const existing = await this.prisma.homeContent.findFirst({ include: { translations: true } });
    if (existing) {
      return existing;
    }
    return this.prisma.homeContent.create({ data: {}, include: { translations: true } });
  }

  private toDto(t: HomeTx): HomeContent {
    return {
      eyebrow: t.eyebrow,
      heroTitle: t.heroTitle,
      heroSubtitle: t.heroSubtitle,
      heroBullets: t.heroBullets,
      heroNote: t.heroNote,
      heroCtaPrimary: t.heroCtaPrimary,
      heroCtaSecondary: t.heroCtaSecondary,
      trustLine: t.trustLine,
      servicesEyebrow: t.servicesEyebrow,
      servicesHeading: t.servicesHeading,
      servicesLede: t.servicesLede,
      servicesSecondaryLabel: t.servicesSecondaryLabel,
      worksHeading: t.worksHeading,
      pricingEyebrow: t.pricingEyebrow,
      pricingHeading: t.pricingHeading,
      pricingNote: t.pricingNote,
      pricingFootnote: t.pricingFootnote,
      ctaTitle: t.ctaTitle,
      ctaSubtitle: t.ctaSubtitle,
      ctaTelegramLabel: t.ctaTelegramLabel,
      ctaCvLabel: t.ctaCvLabel,
    };
  }

  private txInput(translations: HomeTx[], locale: Locale): HomeContent {
    const t = translations.find((x) => x.locale === locale);
    return {
      eyebrow: t?.eyebrow ?? '',
      heroTitle: t?.heroTitle ?? '',
      heroSubtitle: t?.heroSubtitle ?? '',
      heroBullets: t?.heroBullets ?? [],
      heroNote: t?.heroNote ?? '',
      heroCtaPrimary: t?.heroCtaPrimary ?? '',
      heroCtaSecondary: t?.heroCtaSecondary ?? '',
      trustLine: t?.trustLine ?? '',
      servicesEyebrow: t?.servicesEyebrow ?? '',
      servicesHeading: t?.servicesHeading ?? '',
      servicesLede: t?.servicesLede ?? '',
      servicesSecondaryLabel: t?.servicesSecondaryLabel ?? '',
      worksHeading: t?.worksHeading ?? '',
      pricingEyebrow: t?.pricingEyebrow ?? '',
      pricingHeading: t?.pricingHeading ?? '',
      pricingNote: t?.pricingNote ?? '',
      pricingFootnote: t?.pricingFootnote ?? '',
      ctaTitle: t?.ctaTitle ?? '',
      ctaSubtitle: t?.ctaSubtitle ?? '',
      ctaTelegramLabel: t?.ctaTelegramLabel ?? '',
      ctaCvLabel: t?.ctaCvLabel ?? '',
    };
  }
}
