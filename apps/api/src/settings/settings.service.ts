import { Injectable } from '@nestjs/common';
import type { SiteSettings, SiteSettingsUpdate } from '@alcha/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { SiteSettings as SiteSettingsRow } from '@prisma/client';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<SiteSettings> {
    return this.toDto(await this.getOrCreate());
  }

  async update(input: SiteSettingsUpdate): Promise<SiteSettings> {
    const existing = await this.getOrCreate();
    const row = await this.prisma.siteSettings.update({
      where: { id: existing.id },
      data: input,
    });
    return this.toDto(row);
  }

  private async getOrCreate(): Promise<SiteSettingsRow> {
    const existing = await this.prisma.siteSettings.findFirst();
    return existing ?? this.prisma.siteSettings.create({ data: {} });
  }

  private toDto(row: SiteSettingsRow): SiteSettings {
    return {
      email: row.email,
      telegram: row.telegram,
      whatsapp: row.whatsapp,
      github: row.github,
      linkedin: row.linkedin,
      instagram: row.instagram,
      cvUrl: row.cvUrl,
      addressLocality: row.addressLocality,
      addressRegion: row.addressRegion,
      addressCountry: row.addressCountry,
      priceRange: row.priceRange,
      gaId: row.gaId,
      yandexMetrikaId: row.yandexMetrikaId,
    };
  }
}
