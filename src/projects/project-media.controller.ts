import { BadRequestException, Body, Controller, Get, Param, Post, Put, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FilesInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { memoryStorage } from 'multer';
import { Repository } from 'typeorm';
import { AppUrls } from '../common/app-urls';
import { ok } from '../common/api-response';
import { CurrentUser, Public } from '../common/decorators/auth.decorators';
import { AuthUser } from '../common/guards/jwt-auth.guard';
import { StorageService } from '../storage/storage.service';
import { SaveProjectMediaDto } from './dto/project-media.dto';
import { ProjectMedia } from './entities/project-media.entity';
import { ProjectUploadGuard, uploadTicket } from './project-upload.guard';

@Controller('project')
export class ProjectMediaController {
  constructor(
    @InjectRepository(ProjectMedia) private readonly media: Repository<ProjectMedia>,
    private readonly config: ConfigService,
    private readonly urls: AppUrls,
    private readonly storage: StorageService,
  ) {}

  @Public()
  @Get('media')
  async list() {
    return ok('Project media', await this.media.find({ order: { slug: 'ASC' } }));
  }

  @Put('media/:slug')
  async save(@Param('slug') slug: string, @Body() dto: SaveProjectMediaDto) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) throw new BadRequestException('Invalid project slug.');
    await this.media.upsert({ slug, images: dto.images, videos: dto.videos }, ['slug']);
    return ok('Project media saved', await this.media.findOneByOrFail({ slug }));
  }

  // Only authenticated administrators can mint short-lived, upload-only permissions.
  @Post('media/upload-ticket')
  ticket(@CurrentUser() user: AuthUser) {
    const payload = Buffer.from(JSON.stringify({ id: user.id, expires: Date.now() + 5 * 60 * 1000 })).toString('base64url');
    const signature = uploadTicket(payload, this.config.getOrThrow<string>('JWT_SECRET'));
    return ok('Upload permission', { ticket: payload + '.' + signature, url: this.urls.apiRoute('project/media/upload') });
  }

  @Public()
  @Post('media/upload')
  @UseGuards(ProjectUploadGuard)
  @UseInterceptors(FilesInterceptor('file', 1, {
    storage: memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024, files: 1, fields: 0 },
    fileFilter: (_req, file, callback) =>
      ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'].includes(file.mimetype)
        ? callback(null, true)
        : callback(new BadRequestException('Choose a JPEG, PNG, WebP, GIF, MP4 or WebM file.'), false),
  }))
  async upload(@UploadedFiles() files: Express.Multer.File[] = []) {
    if (files.some((file) => file.mimetype.startsWith('image/') && file.size > 10 * 1024 * 1024)) throw new BadRequestException('Images must be 10 MB or smaller.');
    return ok('Media uploaded', await this.storage.upload(files, 'projects', true));
  }
}

