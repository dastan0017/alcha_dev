import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Locale, StackCategory, StackCategoryAdmin, StackCategoryUpsert } from '@alcha/shared';
import { PrismaService } from '../prisma/prisma.service';
import { pickTranslation, LOCALES_TUPLE } from '../common/i18n';

type StackRow = Prisma.StackCategoryGetPayload<{ include: { translations: true } }>;
type StackTx = StackRow['translations'][number];

@Injectable()
export class StackService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(locale: Locale): Promise<StackCategory[]> {
    const rows = await this.prisma.stackCategory.findMany({
      where: { published: true },
      orderBy: { sortOrder: 'asc' },
      include: { translations: true },
    });
    return rows.map((row) => this.toPublic(row, locale));
  }

  async listAdmin(): Promise<StackCategoryAdmin[]> {
    const rows = await this.prisma.stackCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { translations: true },
    });
    return rows.map((row) => this.toAdmin(row));
  }

  async create(input: StackCategoryUpsert): Promise<StackCategoryAdmin> {
    const row = await this.prisma.stackCategory.create({
      data: {
        sortOrder: input.sortOrder,
        published: input.published,
        items: input.items,
        translations: {
          create: LOCALES_TUPLE.map((locale) => ({ locale, ...input.translations[locale] })),
        },
      },
      include: { translations: true },
    });
    return this.toAdmin(row);
  }

  async update(id: string, input: StackCategoryUpsert): Promise<StackCategoryAdmin> {
    await this.ensureExists(id);
    const row = await this.prisma.stackCategory.update({
      where: { id },
      data: {
        sortOrder: input.sortOrder,
        published: input.published,
        items: input.items,
        translations: {
          upsert: LOCALES_TUPLE.map((locale) => ({
            where: { stackCategoryId_locale: { stackCategoryId: id, locale } },
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
    await this.prisma.stackCategory.delete({ where: { id } });
  }

  async reorder(ids: string[]): Promise<void> {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.stackCategory.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
  }

  private async ensureExists(id: string): Promise<void> {
    const found = await this.prisma.stackCategory.findUnique({ where: { id } });
    if (!found) {
      throw new NotFoundException('Stack category not found');
    }
  }

  private toPublic(row: StackRow, locale: Locale): StackCategory {
    const t = pickTranslation(row.translations, locale);
    return { id: row.id, sortOrder: row.sortOrder, title: t.title, items: row.items };
  }

  private toAdmin(row: StackRow): StackCategoryAdmin {
    return {
      id: row.id,
      sortOrder: row.sortOrder,
      published: row.published,
      items: row.items,
      translations: {
        ru: this.txInput(row.translations, 'ru'),
        en: this.txInput(row.translations, 'en'),
      },
    };
  }

  private txInput(translations: StackTx[], locale: Locale) {
    const t = translations.find((x) => x.locale === locale);
    return { title: t?.title ?? '' };
  }
}
