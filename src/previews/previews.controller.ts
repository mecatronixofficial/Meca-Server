import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { ok } from '../common/api-response';
import { Public } from '../common/decorators/auth.decorators';
import { CreateSitePreviewDto, PREVIEW_INDUSTRIES, SitePreviewQueryDto, UpdateSitePreviewDto } from './dto/site-preview.dto';
import { PreviewsService } from './previews.service';

@ApiTags('Website previews')
@Controller('previews')
export class PreviewsController {
  constructor(private readonly previews: PreviewsService) {}

  /** Public "preview your own website" form (multipart; optional `logo` file). 5 per 15 minutes per IP. */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @Post('add')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['company_name', 'industry', 'brand_color', 'contact_name', 'email'],
      properties: {
        logo: { type: 'string', format: 'binary', description: 'PNG, JPEG, WebP or GIF, up to 2 MB' },
        company_name: { type: 'string' },
        industry: { type: 'string', enum: [...PREVIEW_INDUSTRIES] },
        tagline: { type: 'string' },
        description: { type: 'string' },
        brand_color: { type: 'string', example: '#e10600' },
        services: { type: 'string', description: 'JSON array of up to 6 service names' },
        contact_name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        city: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('logo'))
  async create(@Body() dto: CreateSitePreviewDto, @UploadedFile() logo?: Express.Multer.File) {
    return ok('Your website preview is ready.', await this.previews.create(dto, logo));
  }

  /** Public: the details the website renders into the template. */
  @Public()
  @SkipThrottle()
  @Get('public/:id')
  async findPublic(@Param('id', ParseUUIDPipe) id: string) {
    return ok('Preview fetched successfully.', await this.previews.findPublic(id));
  }

  @Get('getall')
  async findAll(@Query() query: SitePreviewQueryDto) {
    return ok('Previews fetched successfully.', await this.previews.findAll(query));
  }

  @Get('get/:id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return ok('Preview fetched successfully.', await this.previews.findOne(id));
  }

  @Put('edit/:id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSitePreviewDto) {
    return ok('Preview updated successfully.', await this.previews.update(id, dto));
  }

  @Delete('delete/:id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.previews.remove(id);
    return ok('Preview deleted successfully.');
  }
}
