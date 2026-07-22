import {
  Body,
  Controller,
  Get,
  HttpCode,
  Module,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  createLeadSchema,
  leadStatusSchema,
  updateLeadSchema,
  type CreateLead,
  type LeadStatus,
  type OkResponse,
  type UpdateLead,
} from '@alcha/shared';
import { LeadsService } from './leads.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Public } from '../common/decorators/public.decorator';
import { TelegramModule } from '../telegram/telegram.module';

function parseStatus(value?: string): LeadStatus | undefined {
  const parsed = leadStatusSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

@ApiTags('leads')
@Controller('leads')
export class LeadsPublicController {
  constructor(private readonly leads: LeadsService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  @HttpCode(201)
  async create(
    @Body(new ZodValidationPipe(createLeadSchema)) body: CreateLead,
  ): Promise<OkResponse> {
    await this.leads.create(body);
    return { ok: true };
  }
}

@ApiTags('admin/leads')
@ApiBearerAuth()
@Controller('admin/leads')
export class LeadsAdminController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.leads.list(parseStatus(status));
  }

  @Get('stats')
  stats() {
    return this.leads.stats();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.leads.get(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateLeadSchema)) body: UpdateLead,
  ) {
    return this.leads.update(id, body);
  }
}

@Module({
  imports: [TelegramModule],
  controllers: [LeadsPublicController, LeadsAdminController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
