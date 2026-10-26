import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ok } from '../common/api-response';
import { Public } from '../common/decorators/auth.decorators';
import { CreateEnquiryDto, EnquiryQueryDto, UpdateEnquiryDto } from './dto/enquiry.dto';
import { EnquiriesService } from './enquiries.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Enquiries')
@Controller('enquiry')
export class EnquiriesController {
  constructor(private readonly enquiries: EnquiriesService) {}

  /** Public contact form; limited to 5 submissions per 15 minutes per IP to curb email spam. */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @Post('add')
  async create(@Body() dto: CreateEnquiryDto) {
    return ok('Enquiry submitted successfully.', await this.enquiries.create(dto));
  }

  @Get('getall')
  async findAll(@Query() query: EnquiryQueryDto) {
    return ok('Enquiries fetched successfully.', await this.enquiries.findAll(query));
  }

  @Get('get/:id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return ok('Enquiries fetched successfully.', await this.enquiries.open(id));
  }

  @Put('edit/:id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEnquiryDto) {
    return ok('Enquiry updated successfully.', await this.enquiries.update(id, dto));
  }

  @Delete('delete/:id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.enquiries.remove(id);
    return ok('Enquiry deleted successfully.');
  }
}
