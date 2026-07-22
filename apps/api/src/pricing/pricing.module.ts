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
import { pricingPlanUpsertSchema, type PricingPlanUpsert } from '@alcha/shared';
import { PricingService } from './pricing.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { reorderSchema, type ReorderInput } from '../common/reorder.dto';

@ApiTags('admin/pricing')
@ApiBearerAuth()
@Controller('admin/pricing')
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Get()
  list() {
    return this.pricing.listAdmin();
  }

  @Post()
  create(@Body(new ZodValidationPipe(pricingPlanUpsertSchema)) body: PricingPlanUpsert) {
    return this.pricing.create(body);
  }

  @Patch('reorder')
  reorder(@Body(new ZodValidationPipe(reorderSchema)) body: ReorderInput) {
    return this.pricing.reorder(body.ids);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(pricingPlanUpsertSchema)) body: PricingPlanUpsert,
  ) {
    return this.pricing.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pricing.remove(id);
  }
}

@Module({
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
