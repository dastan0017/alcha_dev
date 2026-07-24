import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Locale, Project, ProjectAdmin, ProjectUpsert } from '@alcha/shared';
import { PrismaService } from '../prisma/prisma.service';
import { pickTranslation, LOCALES_TUPLE } from '../common/i18n';

type ProjectRow = Prisma.ProjectGetPayload<{ include: { translations: true } }>;
type ProjectTx = ProjectRow['translations'][number];

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(locale: Locale): Promise<Project[]> {
    const rows = await this.prisma.project.findMany({
      where: { published: true },
      orderBy: { sortOrder: 'asc' },
      include: { translations: true },
    });
    return rows.map((row) => this.toPublic(row, locale));
  }

  async listHome(locale: Locale): Promise<Project[]> {
    const rows = await this.prisma.project.findMany({
      where: { published: true, showOnHome: true },
      orderBy: { sortOrder: 'asc' },
      include: { translations: true },
    });
    return rows.map((row) => this.toPublic(row, locale));
  }

  async listAbout(locale: Locale): Promise<Project[]> {
    const rows = await this.prisma.project.findMany({
      where: { published: true, showOnAbout: true },
      orderBy: { sortOrder: 'asc' },
      include: { translations: true },
    });
    return rows.map((row) => this.toPublic(row, locale));
  }

  async getBySlug(slug: string, locale: Locale): Promise<Project> {
    const row = await this.prisma.project.findFirst({
      where: { slug, published: true },
      include: { translations: true },
    });
    if (!row) {
      throw new NotFoundException('Project not found');
    }
    return this.toPublic(row, locale);
  }

  async listAdmin(): Promise<ProjectAdmin[]> {
    const rows = await this.prisma.project.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { translations: true },
    });
    return rows.map((row) => this.toAdmin(row));
  }

  async create(input: ProjectUpsert): Promise<ProjectAdmin> {
    try {
      const row = await this.prisma.project.create({
        data: {
          slug: input.slug,
          badgeType: input.badgeType,
          sortOrder: input.sortOrder,
          showOnHome: input.showOnHome,
          showOnAbout: input.showOnAbout,
          published: input.published,
          screenshots: input.screenshots,
          coverImage: input.coverImage,
          translations: {
            create: LOCALES_TUPLE.map((locale) => ({ locale, ...input.translations[locale] })),
          },
        },
        include: { translations: true },
      });
      return this.toAdmin(row);
    } catch (error) {
      throw this.mapSlugConflict(error, input.slug);
    }
  }

  async update(id: string, input: ProjectUpsert): Promise<ProjectAdmin> {
    await this.ensureExists(id);
    try {
      const row = await this.prisma.project.update({
        where: { id },
        data: {
          slug: input.slug,
          badgeType: input.badgeType,
          sortOrder: input.sortOrder,
          showOnHome: input.showOnHome,
          showOnAbout: input.showOnAbout,
          published: input.published,
          screenshots: input.screenshots,
          coverImage: input.coverImage,
          translations: {
            upsert: LOCALES_TUPLE.map((locale) => ({
              where: { projectId_locale: { projectId: id, locale } },
              create: { locale, ...input.translations[locale] },
              update: { ...input.translations[locale] },
            })),
          },
        },
        include: { translations: true },
      });
      return this.toAdmin(row);
    } catch (error) {
      throw this.mapSlugConflict(error, input.slug);
    }
  }

  async remove(id: string): Promise<void> {
    await this.ensureExists(id);
    await this.prisma.project.delete({ where: { id } });
  }

  async reorder(ids: string[]): Promise<void> {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.project.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
  }

  private async ensureExists(id: string): Promise<void> {
    const found = await this.prisma.project.findUnique({ where: { id } });
    if (!found) {
      throw new NotFoundException('Project not found');
    }
  }

  private mapSlugConflict(error: unknown, slug: string): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(`A project with slug "${slug}" already exists`);
    }
    return error;
  }

  private toPublic(row: ProjectRow, locale: Locale): Project {
    const t = pickTranslation(row.translations, locale);
    return {
      id: row.id,
      slug: row.slug,
      badgeType: row.badgeType,
      sortOrder: row.sortOrder,
      showOnHome: row.showOnHome,
      showOnAbout: row.showOnAbout,
      screenshots: row.screenshots,
      coverImage: row.coverImage,
      title: t.title,
      badge: t.badge,
      typeTag: t.typeTag,
      metaLine: t.metaLine,
      factsLine: t.factsLine,
      role: t.role,
      description: t.description,
      pills: t.pills,
      bullets: t.bullets,
      techChips: t.techChips,
      seoTitle: t.seoTitle,
      seoDescription: t.seoDescription,
    };
  }

  private toAdmin(row: ProjectRow): ProjectAdmin {
    return {
      id: row.id,
      slug: row.slug,
      badgeType: row.badgeType,
      sortOrder: row.sortOrder,
      showOnHome: row.showOnHome,
      showOnAbout: row.showOnAbout,
      published: row.published,
      screenshots: row.screenshots,
      coverImage: row.coverImage,
      translations: {
        ru: this.txInput(row.translations, 'ru'),
        en: this.txInput(row.translations, 'en'),
      },
    };
  }

  private txInput(translations: ProjectTx[], locale: Locale) {
    const t = translations.find((x) => x.locale === locale);
    return {
      title: t?.title ?? '',
      badge: t?.badge ?? '',
      typeTag: t?.typeTag ?? '',
      metaLine: t?.metaLine ?? '',
      factsLine: t?.factsLine ?? '',
      role: t?.role ?? '',
      description: t?.description ?? '',
      pills: t?.pills ?? [],
      bullets: t?.bullets ?? [],
      techChips: t?.techChips ?? [],
      seoTitle: t?.seoTitle ?? '',
      seoDescription: t?.seoDescription ?? '',
    };
  }
}
