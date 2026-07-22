import { Body, Controller, Get, Module, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { seoMetaUpsertSchema, type SeoMetaUpsert } from '@alcha/shared';
import { SeoService } from './seo.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@ApiTags('admin/seo')
@ApiBearerAuth()
@Controller('admin/seo')
export class SeoController {
  constructor(private readonly seo: SeoService) {}

  @Get()
  list() {
    return this.seo.listAdmin();
  }

  @Put()
  upsert(@Body(new ZodValidationPipe(seoMetaUpsertSchema)) body: SeoMetaUpsert) {
    return this.seo.upsert(body);
  }
}

@Module({
  controllers: [SeoController],
  providers: [SeoService],
  exports: [SeoService],
})
export class SeoModule {}
