import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Locale, Service, ServiceAdmin, ServiceUpsert } from '@alcha/shared';
import { PrismaService } from '../prisma/prisma.service';
import { pickTranslation, LOCALES_TUPLE } from '../common/i18n';

type ServiceRow = Prisma.ServiceGetPayload<{ include: { translations: true } }>;
type ServiceTx = ServiceRow['translations'][number];

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(locale: Locale): Promise<Service[]> {
    const rows = await this.prisma.service.findMany({
      where: { published: true },
      orderBy: { sortOrder: 'asc' },
      include: { translations: true },
    });
    return rows.map((row) => this.toPublic(row, locale));
  }

  async listAdmin(): Promise<ServiceAdmin[]> {
    const rows = await this.prisma.service.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { translations: true },
    });
    return rows.map((row) => this.toAdmin(row));
  }

  async create(input: ServiceUpsert): Promise<ServiceAdmin> {
    const row = await this.prisma.service.create({
      data: {
        number: input.number,
        sortOrder: input.sortOrder,
        published: input.published,
        featured: input.featured,
        translations: {
          create: LOCALES_TUPLE.map((locale) => ({ locale, ...input.translations[locale] })),
        },
      },
      include: { translations: true },
    });
    return this.toAdmin(row);
  }

  async update(id: string, input: ServiceUpsert): Promise<ServiceAdmin> {
    await this.ensureExists(id);
    const row = await this.prisma.service.update({
      where: { id },
      data: {
        number: input.number,
        sortOrder: input.sortOrder,
        published: input.published,
        featured: input.featured,
        translations: {
          upsert: LOCALES_TUPLE.map((locale) => ({
            where: { serviceId_locale: { serviceId: id, locale } },
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
    await this.prisma.service.delete({ where: { id } });
  }

  async reorder(ids: string[]): Promise<void> {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.service.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
  }

  private async ensureExists(id: string): Promise<void> {
    const found = await this.prisma.service.findUnique({ where: { id } });
    if (!found) {
      throw new NotFoundException('Service not found');
    }
  }

  private toPublic(row: ServiceRow, locale: Locale): Service {
    const t = pickTranslation(row.translations, locale);
    return {
      id: row.id,
      number: row.number,
      sortOrder: row.sortOrder,
      featured: row.featured,
      title: t.title,
      description: t.description,
      badge: t.badge,
      bullets: t.bullets,
      techLine: t.techLine,
    };
  }

  private toAdmin(row: ServiceRow): ServiceAdmin {
    return {
      id: row.id,
      number: row.number,
      sortOrder: row.sortOrder,
      published: row.published,
      featured: row.featured,
      translations: {
        ru: this.txInput(row.translations, 'ru'),
        en: this.txInput(row.translations, 'en'),
      },
    };
  }

  private txInput(translations: ServiceTx[], locale: Locale) {
    const t = translations.find((x) => x.locale === locale);
    return {
      title: t?.title ?? '',
      description: t?.description ?? '',
      badge: t?.badge ?? '',
      bullets: t?.bullets ?? [],
      techLine: t?.techLine ?? '',
    };
  }
}
