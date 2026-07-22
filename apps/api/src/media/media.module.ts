import { Body, Controller, Delete, Get, Module, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  mediaRegisterSchema,
  presignRequestSchema,
  type MediaRegister,
  type PresignRequest,
} from '@alcha/shared';
import { MediaService } from './media.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@ApiTags('media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('presign')
  presign(@Body(new ZodValidationPipe(presignRequestSchema)) body: PresignRequest) {
    return this.media.presign(body);
  }

  @Post()
  register(@Body(new ZodValidationPipe(mediaRegisterSchema)) body: MediaRegister) {
    return this.media.register(body);
  }

  @Get()
  list() {
    return this.media.list();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.media.remove(id);
  }
}

@Module({
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
