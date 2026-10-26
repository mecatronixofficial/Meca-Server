import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ok } from '../common/api-response';
import { ListQueryDto } from '../common/pagination';
import { CreateVoucherDto } from './dto/voucher.dto';
import { VouchersService } from './vouchers.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Vouchers')
@Controller('voucher')
export class VouchersController {
  constructor(private readonly vouchers: VouchersService) {}

  @Post('add')
  async create(@Body() dto: CreateVoucherDto) {
    const { voucher, delivery } = await this.vouchers.create(dto);
    const message =
      delivery.sent + delivery.failed === 0
        ? 'Voucher added (no subscribers found)'
        : `Voucher added and emailed to ${delivery.sent} subscriber(s)${delivery.failed ? `; ${delivery.failed} email(s) failed` : ''}`;
    return ok(message, { ...voucher, delivery });
  }

  @Get('all')
  async findAll(@Query() query: ListQueryDto) {
    return ok('Voucher list fetched successfully', await this.vouchers.findAll(query));
  }

  @Delete('delete/:id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.vouchers.remove(id);
    return ok('Voucher deleted successfully');
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return ok('Voucher fetched successfully', await this.vouchers.findOne(id));
  }
}
