import { Body, Controller, Get, Module, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { aboutProfileUpdateSchema, type AboutProfileUpdate } from '@alcha/shared';
import { AboutService } from './about.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@ApiTags('admin/about')
@ApiBearerAuth()
@Controller('admin/about')
export class AboutController {
  constructor(private readonly about: AboutService) {}

  @Get()
  get() {
    return this.about.getAdmin();
  }

  @Put()
  update(@Body(new ZodValidationPipe(aboutProfileUpdateSchema)) body: AboutProfileUpdate) {
    return this.about.update(body);
  }
}

@Module({
  controllers: [AboutController],
  providers: [AboutService],
  exports: [AboutService],
})
export class AboutModule {}
