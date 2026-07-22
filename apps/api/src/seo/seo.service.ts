import { Injectable } from '@nestjs/common';
import type { Locale, SeoMeta, SeoMetaUpsert, SeoPage } from '@alcha/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { SeoMeta as SeoRow } from '@prisma/client';

@Injectable()
export class SeoService {
  constructor(private readonly prisma: PrismaService) {}

  /** Resolve SEO for a page/locale, returning safe empty defaults if unseeded. */
  async resolve(page: SeoPage, locale: Locale): Promise<SeoMeta> {
    const row = await this.prisma.seoMeta.findUnique({
      where: { page_locale: { page, locale } },
    });
    if (!row) {
      return { page, locale, title: '', description: '', keywords: [], ogImageUrl: null };
    }
    return this.toDto(row);
  }

  async listAdmin(): Promise<SeoMeta[]> {
    const rows = await this.prisma.seoMeta.findMany({
      orderBy: [{ page: 'asc' }, { locale: 'asc' }],
    });
    return rows.map((row) => this.toDto(row));
  }

  async upsert(input: SeoMetaUpsert): Promise<SeoMeta> {
    const row = await this.prisma.seoMeta.upsert({
      where: { page_locale: { page: input.page, locale: input.locale } },
      create: {
        page: input.page,
        locale: input.locale,
        title: input.title,
        description: input.description,
        keywords: input.keywords,
        ogImageUrl: input.ogImageUrl,
      },
      update: {
        title: input.title,
        description: input.description,
        keywords: input.keywords,
        ogImageUrl: input.ogImageUrl,
      },
    });
    return this.toDto(row);
  }

  private toDto(row: SeoRow): SeoMeta {
    return {
      page: row.page,
      locale: row.locale,
      title: row.title,
      description: row.description,
      keywords: row.keywords,
      ogImageUrl: row.ogImageUrl,
    };
  }
}
