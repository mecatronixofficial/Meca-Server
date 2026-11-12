import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThirukkuralChapter } from './entities/thirukkural-chapter.entity';
import { Thirukkural } from './entities/thirukkural.entity';
import { ThirukkuralController } from './thirukkural.controller';
import { ThirukkuralService } from './thirukkural.service';

@Module({
  imports: [TypeOrmModule.forFeature([Thirukkural, ThirukkuralChapter])],
  controllers: [ThirukkuralController],
  providers: [ThirukkuralService],
})
export class ThirukkuralModule {}
