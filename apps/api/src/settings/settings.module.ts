import { Body, Controller, Get, Module, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { siteSettingsUpdateSchema, type SiteSettingsUpdate } from '@alcha/shared';
import { SettingsService } from './settings.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@ApiTags('admin/settings')
@ApiBearerAuth()
@Controller('admin/settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get() {
    return this.settings.get();
  }

  @Put()
  update(@Body(new ZodValidationPipe(siteSettingsUpdateSchema)) body: SiteSettingsUpdate) {
    return this.settings.update(body);
  }
}

@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
