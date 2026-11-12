import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ok } from '../common/api-response';
import { Public } from '../common/decorators/auth.decorators';
import type { AuthRequest } from '../common/guards/jwt-auth.guard';
import { CreateReviewDto, ReviewQueryDto, UpdateReviewDto } from './dto/review.dto';
import { Review } from './entities/review.entity';
import { ReviewsService } from './reviews.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Reviews')
@Controller('review')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  /** Public review form (website). 5 per 15 minutes per IP; known clients are verified automatically. */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @Post('add')
  async create(@Body() dto: CreateReviewDto) {
    return ok('Review added successfully', await this.reviews.create(dto));
  }

  /**
   * Admins: every review, `?verified=true|false` filters; also supports page, limit and search.
   * Public websites (no admin session): verified reviews only, without reviewers' email addresses.
   */
  @Public()
  @Get('all')
  async findAll(@Query() query: ReviewQueryDto, @Req() request: Partial<AuthRequest>) {
    if (request.user) return ok('Reviews fetched successfully', await this.reviews.findAll(query));

    const result = await this.reviews.findAll({ ...query, verified: 'true' });
    const strip = ({ user_email: _email, ...review }: Review) => review;
    return ok('Reviews fetched successfully', Array.isArray(result) ? result.map(strip) : { ...result, items: result.items.map(strip) });
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
