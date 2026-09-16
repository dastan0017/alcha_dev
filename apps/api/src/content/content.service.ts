import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  AboutResponse,
  HomeResponse,
  Locale,
  Project,
  SiteChrome,
  SiteSettings,
  SiteTree,
} from '@alcha/shared';
import { SettingsService } from '../settings/settings.service';
import { SeoService } from '../seo/seo.service';
import { DraftService } from './draft.service';
import { TreeRepository } from './tree/tree.repository';
import {
  projectAbout,
  projectChrome,
  projectHome,
  projectProject,
  projectProjects,
} from './tree/projection';

/** `published` reads the content tables; `draft` the editor's working copy (preview mode). */
type ContentSource = 'published' | 'draft';

/** Page reads for the web, projected from a content tree. */
@Injectable()
export class ContentService {
  constructor(
    private readonly trees: TreeRepository,
    private readonly drafts: DraftService,
    private readonly settings: SettingsService,
    private readonly seo: SeoService,
  ) {}

  async getHome(source: ContentSource, locale: Locale): Promise<HomeResponse> {
    const [tree, settings, seo] = await Promise.all([
      this.load(source),
      this.settings.get(),
      this.seo.resolve('home', locale),
    ]);
    return projectHome(tree, locale, { settings, seo });
  }

  async getAbout(source: ContentSource, locale: Locale): Promise<AboutResponse> {
    const [tree, settings, seo] = await Promise.all([
      this.load(source),
      this.settings.get(),
      this.seo.resolve('about', locale),
    ]);
    return projectAbout(tree, locale, { settings, seo });
  }

  async getChrome(source: ContentSource, locale: Locale): Promise<SiteChrome> {
    return projectChrome(await this.load(source), locale);
  }

  async listProjects(locale: Locale): Promise<Project[]> {
    return projectProjects(await this.trees.loadPublishedTree(), locale);
  }

  async getProject(source: ContentSource, slug: string, locale: Locale): Promise<Project> {
    const project = projectProject(await this.load(source), slug, locale);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  getSettings(): Promise<SiteSettings> {
    return this.settings.get();
  }

  private load(source: ContentSource): Promise<SiteTree> {
    return source === 'draft' ? this.drafts.currentTree() : this.trees.loadPublishedTree();
  }
}
