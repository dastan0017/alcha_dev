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
import { hobbyCardUpsertSchema, type HobbyCardUpsert } from '@alcha/shared';
import { HobbyService } from './hobby.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { reorderSchema, type ReorderInput } from '../common/reorder.dto';

@ApiTags('admin/hobby')
@ApiBearerAuth()
@Controller('admin/hobby')
export class HobbyController {
  constructor(private readonly hobby: HobbyService) {}

  @Get()
  list() {
    return this.hobby.listAdmin();
  }

  @Post()
  create(@Body(new ZodValidationPipe(hobbyCardUpsertSchema)) body: HobbyCardUpsert) {
    return this.hobby.create(body);
  }

  @Patch('reorder')
  reorder(@Body(new ZodValidationPipe(reorderSchema)) body: ReorderInput) {
    return this.hobby.reorder(body.ids);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(hobbyCardUpsertSchema)) body: HobbyCardUpsert,
  ) {
    return this.hobby.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hobby.remove(id);
  }
}

@Module({
  controllers: [HobbyController],
  providers: [HobbyService],
  exports: [HobbyService],
})
export class HobbyModule {}
