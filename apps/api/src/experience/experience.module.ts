import {
  Body,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { experienceUpsertSchema, type ExperienceUpsert } from '@alcha/shared';
import { ExperienceService } from './experience.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { reorderSchema, type ReorderInput } from '../common/reorder.dto';

@ApiTags('admin/experience')
@ApiBearerAuth()
@Controller('admin/experience')
export class ExperienceController {
  constructor(private readonly experience: ExperienceService) {}

  @Get()
  list() {
    return this.experience.listAdmin();
  }

  @Post()
  create(@Body(new ZodValidationPipe(experienceUpsertSchema)) body: ExperienceUpsert) {
    return this.experience.create(body);
  }

  @Patch('reorder')
  reorder(@Body(new ZodValidationPipe(reorderSchema)) body: ReorderInput) {
    return this.experience.reorder(body.ids);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(experienceUpsertSchema)) body: ExperienceUpsert,
  ) {
    return this.experience.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.experience.remove(id);
  }
}

@Module({
  controllers: [ExperienceController],
  providers: [ExperienceService],
  exports: [ExperienceService],
})
export class ExperienceModule {}
