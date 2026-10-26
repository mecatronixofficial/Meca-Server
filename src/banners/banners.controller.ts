import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ok } from '../common/api-response';
import { ListQueryDto } from '../common/pagination';
import { Public } from '../common/decorators/auth.decorators';
import { BannersService } from './banners.service';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Banners')
@Controller('banner')
export class BannersController {
  constructor(private readonly banners: BannersService) {}

  @Post('add')
  async create(@Body() dto: CreateBannerDto) {
    return ok('Banner added successfully', await this.banners.create(dto));
  }

  @Public()
  @Get('get')
  async findAll(@Query() query: ListQueryDto) {
    return ok('Banners fetched successfully', await this.banners.findAll(query));
  }

  @Get('get/:id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return ok('Banner fetched successfully', await this.banners.findOne(id));
  }

  @Put('edit/:id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBannerDto) {
    return ok('Banner updated successfully', await this.banners.update(id, dto));
  }

  @Delete('delete/:id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.banners.remove(id);
    return ok('Banner deleted successfully');
  }
}
