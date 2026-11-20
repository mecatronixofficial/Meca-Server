import { ProjectMedia } from './entities/project-media.entity';
import { ProjectMediaController } from './project-media.controller';
import { ProjectUploadGuard } from './project-upload.guard';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '../clients/entities/client.entity';
import { Work } from '../works/entities/work.entity';
import { Project } from './entities/project.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Client, Work, ProjectMedia])],
  controllers: [ProjectMediaController, ProjectsController],
  providers: [ProjectsService, ProjectUploadGuard],
})
export class ProjectsModule {}
