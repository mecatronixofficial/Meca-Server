import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Newsletter } from './entities/newsletter.entity';
import { NewslettersController } from './newsletters.controller';
import { NewslettersService } from './newsletters.service';
import { UnsubscribeController } from './unsubscribe.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Newsletter])],
  controllers: [NewslettersController, UnsubscribeController],
  providers: [NewslettersService],
  exports: [NewslettersService],
})
export class NewslettersModule {}
