import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ok } from '../common/api-response';
import { Public } from '../common/decorators/auth.decorators';
import { ListQueryDto } from '../common/pagination';
import { BlogsService } from './blogs.service';
import { CreateBlogDto, UpdateBlogDto } from './dto/blog.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Blogs')
@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogs: BlogsService) {}

  @Post('add')
  async create(@Body() dto: CreateBlogDto) {
    return ok('Blog added successfully.', await this.blogs.create(dto));
  }

  @Get('all')
  async findAll(@Query() query: ListQueryDto) {
    return ok('Blogs fetched successfully.', await this.blogs.findAll(query));
  }

  /** Published blogs only, newest first. Used by the public website; drafts stay private. */
  @Public()
  @Get('published')
  async findPublished() {
    return ok('Blogs fetched successfully.', await this.blogs.findPublished());
  }

  @Put('edit/:id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBlogDto) {
    return ok('Blog updated successfully.', await this.blogs.update(id, dto));
  }

  @Delete('delete/:id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.blogs.remove(id);
    return ok('Blog deleted successfully.');
  }
}
