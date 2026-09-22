import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Module,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  assertLocale,
  contentPatchRequestSchema,
  type AuthUser,
  type ContentPatchRequest,
} from '@alcha/shared';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RevalidateModule } from '../revalidate/revalidate.module';
import { SeoModule } from '../seo/seo.module';
import { SettingsModule } from '../settings/settings.module';
import { ContentService } from './content.service';
import { DraftService } from './draft.service';
import { PreviewTokenGuard, type PreviewRequest } from './preview-token.guard';
import { PreviewTokenService } from './preview-token.service';
import { TreeRepository } from './tree/tree.repository';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Public()
  @Get('home')
  getHome(@Query('locale') locale?: string) {
    return this.content.getHome('published', assertLocale(locale));
  }

  @Public()
  @Get('chrome')
  getChrome(@Query('locale') locale?: string) {
    return this.content.getChrome('published', assertLocale(locale));
  }

  @Public()
  @Get('settings')
  getSettings() {
    return this.content.getSettings();
  }
}

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly content: ContentService) {}

  @Public()
  @Get()
  list(@Query('locale') locale?: string) {
    return this.content.listProjects(assertLocale(locale));
  }

  @Public()
  @Get(':slug')
  getBySlug(@Param('slug') slug: string, @Query('locale') locale?: string) {
    return this.content.getProject('published', slug, assertLocale(locale));
  }
}

/** Draft reads for the web in preview mode, authorised by a preview token (not an admin JWT). */
@ApiTags('content/draft')
@ApiBearerAuth()
@Public()
@UseGuards(PreviewTokenGuard)
@SkipThrottle()
@Controller('content/draft')
export class DraftContentController {
  constructor(private readonly content: ContentService) {}

  @Get('verify')
  verify(@Req() request: PreviewRequest) {
    return request.preview;
  }

  @Get('home')
  getHome(@Query('locale') locale?: string) {
    return this.content.getHome('draft', assertLocale(locale));
  }

  @Get('chrome')
  getChrome(@Query('locale') locale?: string) {
    return this.content.getChrome('draft', assertLocale(locale));
  }

  @Get('projects/:slug')
  getProject(@Param('slug') slug: string, @Query('locale') locale?: string) {
    return this.content.getProject('draft', slug, assertLocale(locale));
  }
}

@ApiTags('admin/content')
@ApiBearerAuth()
@SkipThrottle()
@Controller('admin/content')
export class AdminContentController {
  constructor(
    private readonly drafts: DraftService,
    private readonly previewTokens: PreviewTokenService,
  ) {}

  @Get('tree')
  getTree() {
    return this.drafts.getTree();
  }

  @Patch('draft')
  patch(@Body(new ZodValidationPipe(contentPatchRequestSchema)) body: ContentPatchRequest) {
    return this.drafts.patch(body.patches);
  }

  @Delete('draft')
  reset() {
    return this.drafts.reset();
  }

  @Post('publish')
  @HttpCode(200)
  publish() {
    return this.drafts.publish();
  }

  @Post('preview-token')
  issuePreviewToken(@CurrentUser() user: AuthUser) {
    return this.previewTokens.issue(user.id);
  }
}

@Module({
  imports: [JwtModule.register({}), SettingsModule, SeoModule, RevalidateModule],
  controllers: [
    ContentController,
    ProjectsController,
    DraftContentController,
    AdminContentController,
  ],
  providers: [ContentService, DraftService, TreeRepository, PreviewTokenService],
})
export class ContentModule {}
