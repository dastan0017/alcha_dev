import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Experience, ExperienceAdmin, ExperienceUpsert, Locale } from '@alcha/shared';
import { PrismaService } from '../prisma/prisma.service';
import { pickTranslation, LOCALES_TUPLE } from '../common/i18n';

type ExpRow = Prisma.ExperienceGetPayload<{ include: { translations: true } }>;
type ExpTx = ExpRow['translations'][number];

@Injectable()
export class ExperienceService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(locale: Locale): Promise<Experience[]> {
    const rows = await this.prisma.experience.findMany({
      where: { published: true },
      orderBy: { sortOrder: 'asc' },
      include: { translations: true },
    });
    return rows.map((row) => this.toPublic(row, locale));
  }

  async listAdmin(): Promise<ExperienceAdmin[]> {
    const rows = await this.prisma.experience.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { translations: true },
    });
    return rows.map((row) => this.toAdmin(row));
  }

  async create(input: ExperienceUpsert): Promise<ExperienceAdmin> {
    const row = await this.prisma.experience.create({
      data: {
        company: input.company,
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

  async update(id: string, input: ExperienceUpsert): Promise<ExperienceAdmin> {
    await this.ensureExists(id);
    const row = await this.prisma.experience.update({
      where: { id },
      data: {
        company: input.company,
        sortOrder: input.sortOrder,
        published: input.published,
        translations: {
          upsert: LOCALES_TUPLE.map((locale) => ({
            where: { experienceId_locale: { experienceId: id, locale } },
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
    await this.prisma.experience.delete({ where: { id } });
  }

  async reorder(ids: string[]): Promise<void> {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.experience.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
  }

  private async ensureExists(id: string): Promise<void> {
    const found = await this.prisma.experience.findUnique({ where: { id } });
    if (!found) {
      throw new NotFoundException('Experience not found');
    }
  }

  private toPublic(row: ExpRow, locale: Locale): Experience {
    const t = pickTranslation(row.translations, locale);
    return {
      id: row.id,
      company: row.company,
      sortOrder: row.sortOrder,
      role: t.role,
      meta: t.meta,
      description: t.description,
    };
  }

  private toAdmin(row: ExpRow): ExperienceAdmin {
    return {
      id: row.id,
      company: row.company,
      sortOrder: row.sortOrder,
      published: row.published,
      translations: {
        ru: this.txInput(row.translations, 'ru'),
        en: this.txInput(row.translations, 'en'),
      },
    };
  }

  private txInput(translations: ExpTx[], locale: Locale) {
    const t = translations.find((x) => x.locale === locale);
    return { role: t?.role ?? '', meta: t?.meta ?? '', description: t?.description ?? '' };
  }
}
