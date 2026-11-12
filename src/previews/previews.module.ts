import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SitePreview } from './entities/site-preview.entity';
import { PreviewsController } from './previews.controller';
import { PreviewsService } from './previews.service';

@Module({
  imports: [TypeOrmModule.forFeature([SitePreview])],
  controllers: [PreviewsController],
  providers: [PreviewsService],
  exports: [PreviewsService],
})
export class PreviewsModule {}
