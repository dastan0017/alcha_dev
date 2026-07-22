import { Controller, Get, Module, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { assertLocale } from '@alcha/shared';
import { ContentService } from './content.service';
import { Public } from '../common/decorators/public.decorator';
import { HomeContentModule } from '../home-content/home-content.module';
import { ServicesModule } from '../services/services.module';
import { ProjectsModule } from '../projects/projects.module';
import { PricingModule } from '../pricing/pricing.module';
import { SettingsModule } from '../settings/settings.module';
import { AboutModule } from '../about/about.module';
import { ExperienceModule } from '../experience/experience.module';
import { StackModule } from '../stack/stack.module';
import { HobbyModule } from '../hobby/hobby.module';
import { SeoModule } from '../seo/seo.module';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Public()
  @Get('home')
  getHome(@Query('locale') locale?: string) {
    return this.content.getHome(assertLocale(locale));
  }

  @Public()
  @Get('about')
  getAbout(@Query('locale') locale?: string) {
    return this.content.getAbout(assertLocale(locale));
  }

  @Public()
  @Get('settings')
  getSettings() {
    return this.content.getSettings();
  }
}

@Module({
  imports: [
    HomeContentModule,
    ServicesModule,
    ProjectsModule,
    PricingModule,
    SettingsModule,
    AboutModule,
    ExperienceModule,
    StackModule,
    HobbyModule,
    SeoModule,
  ],
  controllers: [ContentController],
  providers: [ContentService],
})
export class ContentModule {}
