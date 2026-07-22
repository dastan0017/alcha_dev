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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { assertLocale, projectUpsertSchema, type ProjectUpsert } from '@alcha/shared';
import { ProjectsService } from './projects.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { reorderSchema, type ReorderInput } from '../common/reorder.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('projects')
@Controller('projects')
export class ProjectsPublicController {
  constructor(private readonly projects: ProjectsService) {}

  @Public()
  @Get()
  list(@Query('locale') locale?: string) {
    return this.projects.listPublic(assertLocale(locale));
  }

  @Public()
  @Get(':slug')
  getBySlug(@Param('slug') slug: string, @Query('locale') locale?: string) {
    return this.projects.getBySlug(slug, assertLocale(locale));
  }
}

@ApiTags('admin/projects')
@ApiBearerAuth()
@Controller('admin/projects')
export class ProjectsAdminController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list() {
    return this.projects.listAdmin();
  }

  @Post()
  create(@Body(new ZodValidationPipe(projectUpsertSchema)) body: ProjectUpsert) {
    return this.projects.create(body);
  }

  @Patch('reorder')
  reorder(@Body(new ZodValidationPipe(reorderSchema)) body: ReorderInput) {
    return this.projects.reorder(body.ids);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(projectUpsertSchema)) body: ProjectUpsert,
  ) {
    return this.projects.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projects.remove(id);
  }
}

@Module({
  controllers: [ProjectsPublicController, ProjectsAdminController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
