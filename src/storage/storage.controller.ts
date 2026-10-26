import { Body, Controller, Delete, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsOptional, IsUrl } from 'class-validator';
import { ok } from '../common/api-response';
import { StorageService, UPLOAD_FOLDERS, UploadFolder } from './storage.service';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';

class UploadOptionsDto {
  /** Folder inside the bucket; defaults to `uploads`. */
  @IsOptional()
  @IsIn(UPLOAD_FOLDERS)
  folder?: UploadFolder;
}

class DeleteFilesDto {
  /** A single URL string or an array of URLs previously returned by the upload endpoint. */
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one file URL is required' })
  @IsUrl({ require_tld: false }, { each: true })
  urls: string[];
}

@ApiTags('Uploads (R2)')
@Controller('img')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  /** Uploads up to MAX_UPLOAD_FILES files (field name `images`). Size and type limits come from StorageModule. */
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['images'],
      properties: {
        images: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'JPEG, PNG, WebP, GIF or PDF files' },
        folder: { type: 'string', enum: [...UPLOAD_FOLDERS], description: 'Optional folder inside the bucket (default: uploads)' },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('images'))
  async upload(@UploadedFiles() files: Express.Multer.File[] = [], @Body() options: UploadOptionsDto) {
    const uploaded = await this.storage.upload(files, options.folder);
    // `files` at the top level is kept for compatibility with the existing admin client.
    return { success: true, message: 'File(s) uploaded successfully', files: uploaded, data: uploaded };
  }

  @Delete('delete')
  async remove(@Body() body: DeleteFilesDto) {
    return ok('File(s) deleted successfully', { deleted: await this.storage.remove(body.urls) });
  }
}
