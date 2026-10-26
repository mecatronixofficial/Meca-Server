import { BadRequestException, Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

import { ALLOWED_MIME_TYPES } from './file-type';

@Global()
@Module({
  imports: [
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        storage: memoryStorage(),
        limits: { fileSize: config.get<number>('MAX_FILE_SIZE_BYTES'), files: config.get<number>('MAX_UPLOAD_FILES') },
        fileFilter: (_req, file, callback) =>
          ALLOWED_MIME_TYPES.has(file.mimetype)
            ? callback(null, true)
            : callback(new BadRequestException('Invalid file type. Only images and PDFs are allowed.'), false),
      }),
    }),
  ],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
