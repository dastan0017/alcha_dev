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
import { stackCategoryUpsertSchema, type StackCategoryUpsert } from '@alcha/shared';
import { StackService } from './stack.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { reorderSchema, type ReorderInput } from '../common/reorder.dto';

@ApiTags('admin/stack')
@ApiBearerAuth()
@Controller('admin/stack')
export class StackController {
  constructor(private readonly stack: StackService) {}

  @Get()
  list() {
    return this.stack.listAdmin();
  }

  @Post()
  create(@Body(new ZodValidationPipe(stackCategoryUpsertSchema)) body: StackCategoryUpsert) {
    return this.stack.create(body);
  }

  @Patch('reorder')
  reorder(@Body(new ZodValidationPipe(reorderSchema)) body: ReorderInput) {
    return this.stack.reorder(body.ids);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(stackCategoryUpsertSchema)) body: StackCategoryUpsert,
  ) {
    return this.stack.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stack.remove(id);
  }
}

@Module({
  controllers: [StackController],
  providers: [StackService],
  exports: [StackService],
})
export class StackModule {}
