import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ok } from '../common/api-response';
import { ListQueryDto } from '../common/pagination';
import { Public } from '../common/decorators/auth.decorators';
import { CreateWorkDto, UpdateWorkDto } from './dto/work.dto';
import { WorksService } from './works.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Works')
@Controller('work')
export class WorksController {
  constructor(private readonly works: WorksService) {}

  @Post('add')
  async create(@Body() dto: CreateWorkDto) {
    return ok('Work added successfully.', await this.works.create(dto));
  }

  @Public()
  @Get('get')
  async findAll(@Query() query: ListQueryDto) {
    return ok('All works fetched successfully.', await this.works.findAll(query));
  }

  @Get('get/:id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return ok('Work fetched successfully by ID.', await this.works.findOne(id));
  }

  @Put('edit/:id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateWorkDto) {
    return ok('Work updated successfully.', await this.works.update(id, dto));
  }

  @Delete('delete/:id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.works.remove(id);
    return ok('Work deleted successfully.');
  }
}
