import { Body, Controller, Injectable, Module, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ALL_STATIC_CONTENT_TAGS,
  CacheTags,
  publishRequestSchema,
  type PublishRequest,
  type PublishResponse,
} from '@alcha/shared';
import { RevalidateModule, RevalidateService } from '../revalidate/revalidate.module';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Injectable()
export class PublishService {
  constructor(private readonly revalidate: RevalidateService) {}

  async publish(req: PublishRequest): Promise<PublishResponse> {
    const tags = this.resolveTags(req);
    const revalidated = await this.revalidate.revalidate(tags);
    return { ok: true, tags, revalidated };
  }

  private resolveTags(req: PublishRequest): string[] {
    switch (req.target) {
      case 'home':
        return [CacheTags.home];
      case 'about':
        return [CacheTags.about];
      case 'settings':
        // Contacts/socials render in the footer of every page.
        return [CacheTags.settings, CacheTags.home, CacheTags.about];
      case 'projects': {
        const tags: string[] = [CacheTags.projects, CacheTags.home, CacheTags.about];
        if (req.slug) {
          tags.push(CacheTags.project(req.slug));
        }
        return tags;
      }
      case 'all':
      default:
        return [...ALL_STATIC_CONTENT_TAGS];
    }
  }
}

@ApiTags('publish')
@ApiBearerAuth()
@Controller('publish')
export class PublishController {
  constructor(private readonly publish: PublishService) {}

  @Post()
  run(@Body(new ZodValidationPipe(publishRequestSchema)) body: PublishRequest) {
    return this.publish.publish(body);
  }
}

@Module({
  imports: [RevalidateModule],
  controllers: [PublishController],
  providers: [PublishService],
  exports: [PublishService],
})
export class PublishModule {}
