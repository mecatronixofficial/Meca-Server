import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ok } from '../common/api-response';
import { Public } from '../common/decorators/auth.decorators';
import { DailyKuralQueryDto, KuralListQueryDto, SetHighlightDto } from './dto/thirukkural.dto';
import { ThirukkuralService } from './thirukkural.service';

@ApiTags('Thirukkural')
@Controller('thirukkural')
export class ThirukkuralController {
  constructor(private readonly thirukkural: ThirukkuralService) {}

  /** Public: the kural of the day for the home page. Changes at midnight India time; `next_change_at` says when. */
  @Public()
  @SkipThrottle()
  @Get('today')
  async today(@Query() query: DailyKuralQueryDto) {
    return ok("Today's kural fetched successfully", await this.thirukkural.getDaily(query.date));
  }

  /** Public: title, author, commentators, totals, and the paal → iyal → chapter outline (all 133 chapters). */
  @Public()
  @Get('about')
  async about() {
    return ok('Thirukkural details fetched successfully', await this.thirukkural.getAbout());
  }

  /** Public: one chapter (adhigaram, 1-133) with its 10 kurals. */
  @Public()
  @Get('chapters/:number')
  async chapter(@Param('number', ParseIntPipe) number: number) {
    return ok('Chapter fetched successfully', await this.thirukkural.findChapter(number));
  }

  /** Public: paginated kurals. Filter by `chapter`, `paal`, `highlighted=true`, or `search` (text or kural number). */
  @Public()
  @Get('kurals')
  async findAll(@Query() query: KuralListQueryDto) {
    return ok('Kurals fetched successfully', await this.thirukkural.findAll(query));
  }

  /** Public: one kural (1-1330) with its chapter. */
  @Public()
  @Get('kurals/:number')
  async findOne(@Param('number', ParseIntPipe) number: number) {
    return ok('Kural fetched successfully', await this.thirukkural.findOne(number));
  }

  /** Admin: add a kural to, or remove it from, the website's highlights. */
  @Patch('kurals/:number/highlight')
  async setHighlight(@Param('number', ParseIntPipe) number: number, @Body() dto: SetHighlightDto) {
    const kural = await this.thirukkural.setHighlight(number, dto.is_highlighted);
    return ok(dto.is_highlighted ? 'Kural highlighted' : 'Kural removed from highlights', kural);
  }
}
