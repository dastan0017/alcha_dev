import { Injectable } from '@nestjs/common';
import type { AboutResponse, HomeResponse, Locale, SiteSettings } from '@alcha/shared';
import { HomeContentService } from '../home-content/home-content.service';
import { ServicesService } from '../services/services.service';
import { ProjectsService } from '../projects/projects.service';
import { PricingService } from '../pricing/pricing.service';
import { SettingsService } from '../settings/settings.service';
import { AboutService } from '../about/about.service';
import { ExperienceService } from '../experience/experience.service';
import { StackService } from '../stack/stack.service';
import { HobbyService } from '../hobby/hobby.service';
import { SeoService } from '../seo/seo.service';

@Injectable()
export class ContentService {
  constructor(
    private readonly homeContent: HomeContentService,
    private readonly services: ServicesService,
    private readonly projects: ProjectsService,
    private readonly pricing: PricingService,
    private readonly settings: SettingsService,
    private readonly about: AboutService,
    private readonly experience: ExperienceService,
    private readonly stack: StackService,
    private readonly hobby: HobbyService,
    private readonly seo: SeoService,
  ) {}

  async getHome(locale: Locale): Promise<HomeResponse> {
    const [content, services, projects, pricingPlans, settings, seo] = await Promise.all([
      this.homeContent.get(locale),
      this.services.listPublic(locale),
      this.projects.listHome(locale),
      this.pricing.listPublic(locale),
      this.settings.get(),
      this.seo.resolve('home', locale),
    ]);
    return { content, services, projects, pricingPlans, settings, seo };
  }

  async getAbout(locale: Locale): Promise<AboutResponse> {
    const [profile, experiences, projects, stack, hobbies, cta, settings, seo] = await Promise.all([
      this.about.get(locale),
      this.experience.listPublic(locale),
      this.projects.listAbout(locale),
      this.stack.listPublic(locale),
      this.hobby.listPublic(locale),
      this.homeContent.getCta(locale),
      this.settings.get(),
      this.seo.resolve('about', locale),
    ]);
    return { profile, experiences, projects, stack, hobbies, cta, settings, seo };
  }

  getSettings(): Promise<SiteSettings> {
    return this.settings.get();
  }
}
