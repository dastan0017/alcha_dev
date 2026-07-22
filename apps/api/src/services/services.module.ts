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
import { serviceUpsertSchema, type ServiceUpsert } from '@alcha/shared';
import { ServicesService } from './services.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { reorderSchema, type ReorderInput } from '../common/reorder.dto';

@ApiTags('admin/services')
@ApiBearerAuth()
@Controller('admin/services')
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  list() {
    return this.services.listAdmin();
  }

  @Post()
  create(@Body(new ZodValidationPipe(serviceUpsertSchema)) body: ServiceUpsert) {
    return this.services.create(body);
  }

  @Patch('reorder')
  reorder(@Body(new ZodValidationPipe(reorderSchema)) body: ReorderInput) {
    return this.services.reorder(body.ids);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(serviceUpsertSchema)) body: ServiceUpsert,
  ) {
    return this.services.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.services.remove(id);
  }
}

@Module({
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
