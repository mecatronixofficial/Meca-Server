import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ok } from '../common/api-response';
import { Public } from '../common/decorators/auth.decorators';
import { DeleteManyDto } from '../common/dto/delete-many.dto';
import { ListQueryDto } from '../common/pagination';
import { SubscribeDto } from './dto/newsletter.dto';
import { NewslettersService } from './newsletters.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Newsletter')
@Controller('news')
export class NewslettersController {
  constructor(private readonly newsletters: NewslettersService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @Post('add')
  async subscribe(@Body() dto: SubscribeDto) {
    return ok('Subscribed successfully', await this.newsletters.subscribe(dto.email));
  }

  /** Totals, daily sign-ups and the subscriber list; `page`/`limit`/`search` apply to the list. */
  @Get('get')
  async stats(@Query() query: ListQueryDto) {
    return ok('Subscribers fetched successfully', await this.newsletters.stats(query));
  }

  @Delete('delete')
  async remove(@Body() dto: DeleteManyDto) {
    const deleted = await this.newsletters.removeMany(dto.ids);
    return ok(`${deleted} subscriber(s) deleted successfully`, { deleted });
  }
}
