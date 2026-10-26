import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ok } from '../common/api-response';
import { InvoiceQueryDto, SaveInvoiceDto } from './dto/invoice.dto';
import { InvoicesService } from './invoices.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Invoices')
@Controller('invoice')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Post('add')
  async create(@Body() dto: SaveInvoiceDto) {
    return ok('Invoice saved successfully', await this.invoices.create(dto));
  }

  @Get('all')
  async findAll(@Query() query: InvoiceQueryDto) {
    return ok('Invoice list fetched successfully', await this.invoices.findAll(query));
  }

  @Put('edit/:id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SaveInvoiceDto) {
    return ok('Invoice updated successfully', await this.invoices.update(id, dto));
  }

  @Patch('generate-bill/:id')
  async generateBill(@Param('id', ParseUUIDPipe) id: string) {
    return ok('Bill generated successfully', await this.invoices.markBillGenerated(id));
  }

  @Post('send-email/:id')
  async sendEmail(@Param('id', ParseUUIDPipe) id: string) {
    return ok('Invoice email sent successfully', await this.invoices.sendEmail(id));
  }

  @Patch('send-whatsapp/:id')
  async sendWhatsapp(@Param('id', ParseUUIDPipe) id: string) {
    return ok('Invoice marked as sent on WhatsApp', await this.invoices.markWhatsappSent(id));
  }

  @Delete('delete/:id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.invoices.remove(id);
    return ok('Invoice deleted successfully');
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return ok('Invoice fetched successfully', await this.invoices.findOne(id));
  }
}
