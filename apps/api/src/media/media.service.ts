import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import type { MediaAsset, MediaRegister, PresignRequest, PresignResponse } from '@alcha/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { MediaAsset as MediaRow } from '@prisma/client';

@Injectable()
export class MediaService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.bucket = config.getOrThrow<string>('S3_BUCKET');
    this.publicUrl = config.getOrThrow<string>('S3_PUBLIC_URL').replace(/\/+$/, '');
    // Dev (MinIO) sets an explicit endpoint; real AWS leaves S3_ENDPOINT blank so the
    // SDK resolves the regional endpoint itself. Passing an empty string works today,
    // but being explicit keeps it from silently signing against "" if that ever changes.
    const endpoint = config.getOrThrow<string>('S3_ENDPOINT').trim();
    this.s3 = new S3Client({
      region: config.getOrThrow<string>('S3_REGION'),
      ...(endpoint ? { endpoint } : {}),
      forcePathStyle: config.get<boolean>('S3_FORCE_PATH_STYLE') ?? true,
      // The SDK defaults to WHEN_SUPPORTED, which hoists an x-amz-checksum-crc32 of an
      // EMPTY body into the signed query string. MinIO ignores it; real AWS validates it
      // against the uploaded bytes and rejects every browser upload with HTTP 400.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      credentials: {
        accessKeyId: config.getOrThrow<string>('S3_ACCESS_KEY'),
        secretAccessKey: config.getOrThrow<string>('S3_SECRET_KEY'),
      },
    });
  }

  async presign(input: PresignRequest): Promise<PresignResponse> {
    const safe = input.filename
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const key = `uploads/${randomUUID()}-${safe || 'file'}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: input.contentType,
    });
    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 600 });
    return {
      uploadUrl,
      publicUrl: `${this.publicUrl}/${key}`,
      key,
      method: 'PUT',
      headers: { 'Content-Type': input.contentType },
    };
  }

  async register(input: MediaRegister): Promise<MediaAsset> {
    const row = await this.prisma.mediaAsset.upsert({
      where: { key: input.key },
      create: {
        key: input.key,
        url: input.url,
        filename: input.filename,
        mimeType: input.mimeType,
        size: input.size,
        width: input.width,
        height: input.height,
      },
      update: {
        url: input.url,
        filename: input.filename,
        mimeType: input.mimeType,
        size: input.size,
        width: input.width,
        height: input.height,
      },
    });
    return this.toDto(row);
  }

  async list(): Promise<MediaAsset[]> {
    const rows = await this.prisma.mediaAsset.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((row) => this.toDto(row));
  }

  async remove(id: string): Promise<void> {
    const row = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Media asset not found');
    }
    try {
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: row.key }));
    } catch {
      // Ignore storage errors — remove the DB record regardless.
    }
    await this.prisma.mediaAsset.delete({ where: { id } });
  }

  private toDto(row: MediaRow): MediaAsset {
    return {
      id: row.id,
      url: row.url,
      key: row.key,
      filename: row.filename,
      mimeType: row.mimeType,
      size: row.size,
      width: row.width,
      height: row.height,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
