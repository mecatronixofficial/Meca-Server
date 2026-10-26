import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ok } from '../common/api-response';
import { Public } from '../common/decorators/auth.decorators';
import { CreateReviewDto, ReviewQueryDto, UpdateReviewDto } from './dto/review.dto';
import { ReviewsService } from './reviews.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Reviews')
@Controller('review')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Public()
  @Post('add')
  async create(@Body() dto: CreateReviewDto) {
    return ok('Review added successfully', await this.reviews.create(dto));
  }

  /** `?verified=true|false` filters by verification status; also supports page, limit and search. */
  @Public()
  @Get('all')
  async findAll(@Query() query: ReviewQueryDto) {
    return ok('Reviews fetched successfully', await this.reviews.findAll(query));
  }

  @Put('edit/:id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateReviewDto) {
    return ok('Review updated successfully', await this.reviews.update(id, dto));
  }

  @Delete('delete/:id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.reviews.remove(id);
    return ok('Review deleted successfully');
  }
}
