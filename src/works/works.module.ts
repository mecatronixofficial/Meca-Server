import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../projects/entities/project.entity';
import { Work } from './entities/work.entity';
import { WorksController } from './works.controller';
import { WorksService } from './works.service';

@Module({
  imports: [TypeOrmModule.forFeature([Work, Project])],
  controllers: [WorksController],
  providers: [WorksService],
})
export class WorksModule {}
