import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { HobbyCard, HobbyCardAdmin, HobbyCardUpsert, Locale } from '@alcha/shared';
import { PrismaService } from '../prisma/prisma.service';
import { pickTranslation, LOCALES_TUPLE } from '../common/i18n';

type HobbyRow = Prisma.HobbyCardGetPayload<{ include: { translations: true } }>;
type HobbyTx = HobbyRow['translations'][number];

@Injectable()
export class HobbyService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(locale: Locale): Promise<HobbyCard[]> {
    const rows = await this.prisma.hobbyCard.findMany({
      where: { published: true },
      orderBy: { sortOrder: 'asc' },
      include: { translations: true },
    });
    return rows.map((row) => this.toPublic(row, locale));
  }

  async listAdmin(): Promise<HobbyCardAdmin[]> {
    const rows = await this.prisma.hobbyCard.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { translations: true },
    });
    return rows.map((row) => this.toAdmin(row));
  }

  async create(input: HobbyCardUpsert): Promise<HobbyCardAdmin> {
    const row = await this.prisma.hobbyCard.create({
      data: {
        handle: input.handle,
        url: input.url,
        imageUrl: input.imageUrl,
        sortOrder: input.sortOrder,
        published: input.published,
        translations: {
          create: LOCALES_TUPLE.map((locale) => ({ locale, ...input.translations[locale] })),
        },
      },
      include: { translations: true },
    });
    return this.toAdmin(row);
  }

  async update(id: string, input: HobbyCardUpsert): Promise<HobbyCardAdmin> {
    await this.ensureExists(id);
    const row = await this.prisma.hobbyCard.update({
      where: { id },
      data: {
        handle: input.handle,
        url: input.url,
        imageUrl: input.imageUrl,
        sortOrder: input.sortOrder,
        published: input.published,
        translations: {
          upsert: LOCALES_TUPLE.map((locale) => ({
            where: { hobbyCardId_locale: { hobbyCardId: id, locale } },
            create: { locale, ...input.translations[locale] },
            update: { ...input.translations[locale] },
          })),
        },
      },
      include: { translations: true },
    });
    return this.toAdmin(row);
  }

  async remove(id: string): Promise<void> {
    await this.ensureExists(id);
    await this.prisma.hobbyCard.delete({ where: { id } });
  }

  async reorder(ids: string[]): Promise<void> {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.hobbyCard.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
  }

  private async ensureExists(id: string): Promise<void> {
    const found = await this.prisma.hobbyCard.findUnique({ where: { id } });
    if (!found) {
      throw new NotFoundException('Hobby card not found');
    }
  }

  private toPublic(row: HobbyRow, locale: Locale): HobbyCard {
    const t = pickTranslation(row.translations, locale);
    return {
      id: row.id,
      sortOrder: row.sortOrder,
      handle: row.handle,
      url: row.url,
      imageUrl: row.imageUrl,
      title: t.title,
      description: t.description,
    };
  }

  private toAdmin(row: HobbyRow): HobbyCardAdmin {
    return {
      id: row.id,
      handle: row.handle,
      url: row.url,
      imageUrl: row.imageUrl,
      sortOrder: row.sortOrder,
      published: row.published,
      translations: {
        ru: this.txInput(row.translations, 'ru'),
        en: this.txInput(row.translations, 'en'),
      },
    };
  }

  private txInput(translations: HobbyTx[], locale: Locale) {
    const t = translations.find((x) => x.locale === locale);
    return { title: t?.title ?? '', description: t?.description ?? '' };
  }
}
