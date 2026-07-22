import { Body, Controller, Get, Module, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { homeContentUpdateSchema, type HomeContentUpdate } from '@alcha/shared';
import { HomeContentService } from './home-content.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@ApiTags('admin/home')
@ApiBearerAuth()
@Controller('admin/home')
export class HomeContentController {
  constructor(private readonly home: HomeContentService) {}

  @Get()
  get() {
    return this.home.getAdmin();
  }

  @Put()
  update(@Body(new ZodValidationPipe(homeContentUpdateSchema)) body: HomeContentUpdate) {
    return this.home.update(body);
  }
}

@Module({
  controllers: [HomeContentController],
  providers: [HomeContentService],
  exports: [HomeContentService],
})
export class HomeContentModule {}
