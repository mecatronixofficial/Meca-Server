import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ok } from '../common/api-response';
import { ListQueryDto } from '../common/pagination';
import { Public } from '../common/decorators/auth.decorators';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectsService } from './projects.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Projects')
@Controller('project')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post('add')
  async create(@Body() dto: CreateProjectDto) {
    return ok('Project added successfully', await this.projects.create(dto));
  }

  @Public()
  @Get('all')
  async findAll(@Query() query: ListQueryDto) {
    return ok('Projects fetched successfully', await this.projects.findAll(query));
  }

  @Put('edit/:id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProjectDto) {
    return ok('Project updated successfully', await this.projects.update(id, dto));
  }

  @Delete('delete/:id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.projects.remove(id);
    return ok('Project deleted successfully');
  }

  // Declared last so the static routes above take precedence over ':id'.
  @Public()
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return ok('Project fetched successfully', await this.projects.findOne(id));
  }
}
