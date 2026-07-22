import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateLead, Lead, LeadStats, LeadStatus, UpdateLead } from '@alcha/shared';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.module';
import type { Lead as LeadRow } from '@prisma/client';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
  ) {}

  async create(input: CreateLead): Promise<void> {
    // Honeypot: real users never fill `website`; silently drop bot submissions.
    if (input.website && input.website.trim().length > 0) {
      return;
    }
    const lead = await this.prisma.lead.create({
      data: {
        name: input.name,
        contact: input.contact,
        message: input.message,
        sourcePath: input.sourcePath,
        locale: input.locale,
      },
    });
    await this.telegram.notify(this.formatNotification(lead));
  }

  async list(status?: LeadStatus): Promise<Lead[]> {
    const rows = await this.prisma.lead.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toDto(row));
  }

  async stats(): Promise<LeadStats> {
    const grouped = await this.prisma.lead.groupBy({ by: ['status'], _count: { _all: true } });
    const stats: LeadStats = { total: 0, new: 0, in_progress: 0, paid: 0, closed: 0 };
    for (const group of grouped) {
      stats[group.status] = group._count._all;
      stats.total += group._count._all;
    }
    return stats;
  }

  async get(id: string): Promise<Lead> {
    const row = await this.prisma.lead.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Lead not found');
    }
    return this.toDto(row);
  }

  async update(id: string, input: UpdateLead): Promise<Lead> {
    await this.get(id);
    const row = await this.prisma.lead.update({
      where: { id },
      data: { status: input.status, note: input.note },
    });
    return this.toDto(row);
  }

  private toDto(row: LeadRow): Lead {
    return {
      id: row.id,
      name: row.name,
      contact: row.contact,
      message: row.message,
      status: row.status,
      note: row.note,
      sourcePath: row.sourcePath,
      locale: row.locale,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private formatNotification(row: LeadRow): string {
    return [
      '🔔 <b>Новая заявка — alcha.dev</b>',
      `<b>Имя:</b> ${escapeHtml(row.name)}`,
      `<b>Контакт:</b> ${escapeHtml(row.contact)}`,
      `<b>Страница:</b> ${escapeHtml(row.sourcePath)}`,
      '',
      escapeHtml(row.message),
    ].join('\n');
  }
}
