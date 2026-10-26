import { DeleteObjectsCommand, HeadBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { detectFileType } from './file-type';

/** Folders uploads may be grouped into inside the bucket. */
export const UPLOAD_FOLDERS = ['uploads', 'admins', 'banners', 'blogs', 'clients', 'projects', 'works', 'vouchers', 'invoices'] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export interface UploadedObject {
  url: string;
  key: string;
  name: string;
  type: string;
  size: number;
}

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

/** Cloudflare R2 (S3-compatible) object storage. */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(config: ConfigService) {
    this.bucket = config.getOrThrow<string>('R2_BUCKET');
    this.publicUrl = config.getOrThrow<string>('R2_PUBLIC_URL').replace(/\/$/, '');
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.getOrThrow<string>('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
      },
    });
  }

  /**
   * Uploads files to `<folder>/<yyyy>/<mm>/<uuid>-<name>`. The real file type is checked from the
   * content, so a renamed executable cannot be stored as an image.
   */
  async upload(files: Express.Multer.File[], folder: UploadFolder = 'uploads'): Promise<UploadedObject[]> {
    if (!files.length) throw new BadRequestException('No files provided');
    const typed = files.map((file) => {
      const type = detectFileType(file.buffer);
      if (!type) throw new BadRequestException(`"${file.originalname}" is not a valid JPEG, PNG, WebP, GIF or PDF file.`);
      return { file, type };
    });

    const now = new Date();
    const prefix = `${folder}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    return Promise.all(
      typed.map(async ({ file, type }) => {
        const key = `${prefix}/${randomUUID()}-${this.safeName(file.originalname, type)}`;
        await this.client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: file.buffer,
            ContentType: type,
            ContentDisposition: type === 'application/pdf' ? 'inline' : undefined,
            CacheControl: 'public, max-age=31536000, immutable',
          }),
        );
        return { url: `${this.publicUrl}/${key}`, key, name: file.originalname, type, size: file.size };
      }),
    );
  }

  /** Deletes objects by their public URLs. Throws on URLs that do not belong to this bucket. */
  async remove(urls: string[]): Promise<string[]> {
    if (!urls.length) throw new BadRequestException('At least one file URL is required');
    const keys = urls.map((url) => {
      const key = this.keyFor(url);
      if (!key) throw new BadRequestException(`Not a file from this storage: ${url}`);
      return key;
    });
    await this.client.send(new DeleteObjectsCommand({ Bucket: this.bucket, Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true } }));
    return keys;
  }

  /** Best-effort cleanup used when a record that owns files is deleted. Foreign URLs are skipped, errors are logged. */
  async removeQuietly(urls: Array<string | null | undefined>): Promise<void> {
    const own = urls.filter((url): url is string => !!url && !!this.keyFor(url));
    if (!own.length) return;
    try {
      await this.remove(own);
    } catch (error) {
      this.logger.warn(`Could not delete ${own.length} file(s) from R2: ${(error as Error).message}`);
    }
  }

  /** True when the bucket is reachable with the configured credentials. */
  async isReachable(): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return true;
    } catch {
      return false;
    }
  }

  private keyFor(url: string): string | null {
    return url.startsWith(`${this.publicUrl}/`) ? decodeURIComponent(url.slice(this.publicUrl.length + 1)) : null;
  }

  private safeName(original: string, type: string): string {
    const base = original
      .replace(/\.[^.]*$/, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
    return `${base || 'file'}${EXTENSIONS[type]}`.toLowerCase();
  }
}
