import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AboutProfile, AboutProfileUpdate, Locale } from '@alcha/shared';
import { PrismaService } from '../prisma/prisma.service';
import { pickTranslation, LOCALES_TUPLE } from '../common/i18n';

type AboutRow = Prisma.AboutProfileGetPayload<{ include: { translations: true } }>;
type AboutTx = AboutRow['translations'][number];

@Injectable()
export class AboutService {
  constructor(private readonly prisma: PrismaService) {}

  async get(locale: Locale): Promise<AboutProfile> {
    const row = await this.getOrCreate();
    const t = pickTranslation(row.translations, locale);
    return {
      name: t.name,
      photoUrl: row.photoUrl,
      photoCaption: t.photoCaption,
      bioHtml: t.bioHtml,
      experienceHeading: t.experienceHeading,
      projectsHeading: t.projectsHeading,
      stackHeading: t.stackHeading,
      hobbiesHeading: t.hobbiesHeading,
    };
  }

  async getAdmin(): Promise<AboutProfileUpdate> {
    const row = await this.getOrCreate();
    return {
      photoUrl: row.photoUrl,
      translations: {
        ru: this.txInput(row.translations, 'ru'),
        en: this.txInput(row.translations, 'en'),
      },
    };
  }

  async update(input: AboutProfileUpdate): Promise<AboutProfileUpdate> {
    const row = await this.getOrCreate();
    await this.prisma.aboutProfile.update({
      where: { id: row.id },
      data: {
        photoUrl: input.photoUrl,
        translations: {
          upsert: LOCALES_TUPLE.map((locale) => ({
            where: { aboutProfileId_locale: { aboutProfileId: row.id, locale } },
            create: { locale, ...input.translations[locale] },
            update: { ...input.translations[locale] },
          })),
        },
      },
    });
    return this.getAdmin();
  }

  private async getOrCreate(): Promise<AboutRow> {
    const existing = await this.prisma.aboutProfile.findFirst({ include: { translations: true } });
    if (existing) {
      return existing;
    }
    return this.prisma.aboutProfile.create({ data: {}, include: { translations: true } });
  }

  private txInput(translations: AboutTx[], locale: Locale) {
    const t = translations.find((x) => x.locale === locale);
    return {
      name: t?.name ?? '',
      photoCaption: t?.photoCaption ?? '',
      bioHtml: t?.bioHtml ?? '',
      experienceHeading: t?.experienceHeading ?? '',
      projectsHeading: t?.projectsHeading ?? '',
      stackHeading: t?.stackHeading ?? '',
      hobbiesHeading: t?.hobbiesHeading ?? '',
    };
  }
}
