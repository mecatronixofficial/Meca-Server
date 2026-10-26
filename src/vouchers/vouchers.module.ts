import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewslettersModule } from '../newsletters/newsletters.module';
import { Voucher } from './entities/voucher.entity';
import { VouchersController } from './vouchers.controller';
import { VouchersService } from './vouchers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Voucher]), NewslettersModule],
  controllers: [VouchersController],
  providers: [VouchersService],
})
export class VouchersModule {}
