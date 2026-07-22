import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Locale, PricingPlan, PricingPlanAdmin, PricingPlanUpsert } from '@alcha/shared';
import { PrismaService } from '../prisma/prisma.service';
import { pickTranslation, LOCALES_TUPLE } from '../common/i18n';

type PlanRow = Prisma.PricingPlanGetPayload<{ include: { translations: true } }>;
type PlanTx = PlanRow['translations'][number];

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(locale: Locale): Promise<PricingPlan[]> {
    const rows = await this.prisma.pricingPlan.findMany({
      where: { published: true },
      orderBy: { sortOrder: 'asc' },
      include: { translations: true },
    });
    return rows.map((row) => this.toPublic(row, locale));
  }

  async listAdmin(): Promise<PricingPlanAdmin[]> {
    const rows = await this.prisma.pricingPlan.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { translations: true },
    });
    return rows.map((row) => this.toAdmin(row));
  }

  async create(input: PricingPlanUpsert): Promise<PricingPlanAdmin> {
    const row = await this.prisma.pricingPlan.create({
      data: {
        sortOrder: input.sortOrder,
        highlighted: input.highlighted,
        published: input.published,
        translations: {
          create: LOCALES_TUPLE.map((locale) => ({ locale, ...input.translations[locale] })),
        },
      },
      include: { translations: true },
    });
    return this.toAdmin(row);
  }

  async update(id: string, input: PricingPlanUpsert): Promise<PricingPlanAdmin> {
    await this.ensureExists(id);
    const row = await this.prisma.pricingPlan.update({
      where: { id },
      data: {
        sortOrder: input.sortOrder,
        highlighted: input.highlighted,
        published: input.published,
        translations: {
          upsert: LOCALES_TUPLE.map((locale) => ({
            where: { planId_locale: { planId: id, locale } },
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
    await this.prisma.pricingPlan.delete({ where: { id } });
  }

  async reorder(ids: string[]): Promise<void> {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.pricingPlan.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
  }

  private async ensureExists(id: string): Promise<void> {
    const found = await this.prisma.pricingPlan.findUnique({ where: { id } });
    if (!found) {
      throw new NotFoundException('Pricing plan not found');
    }
  }

  private toPublic(row: PlanRow, locale: Locale): PricingPlan {
    const t = pickTranslation(row.translations, locale);
    return {
      id: row.id,
      sortOrder: row.sortOrder,
      highlighted: row.highlighted,
      name: t.name,
      priceLabel: t.priceLabel,
      termLine: t.termLine,
      highlightLabel: t.highlightLabel,
      description: t.description,
      features: t.features,
    };
  }

  private toAdmin(row: PlanRow): PricingPlanAdmin {
    return {
      id: row.id,
      sortOrder: row.sortOrder,
      highlighted: row.highlighted,
      published: row.published,
      translations: {
        ru: this.txInput(row.translations, 'ru'),
        en: this.txInput(row.translations, 'en'),
      },
    };
  }

  private txInput(translations: PlanTx[], locale: Locale) {
    const t = translations.find((x) => x.locale === locale);
    return {
      name: t?.name ?? '',
      priceLabel: t?.priceLabel ?? '',
      termLine: t?.termLine ?? '',
      highlightLabel: t?.highlightLabel ?? '',
      description: t?.description ?? '',
      features: t?.features ?? [],
    };
  }
}
