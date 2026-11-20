import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ok } from '../common/api-response';
import { Public } from '../common/decorators/auth.decorators';
import { ContactSettingsDto } from './dto/contact-settings.dto';
import { MecaBoardDto } from './dto/meca-board.dto';
import { TechStackDto } from './dto/tech-stack.dto';
import { SettingsService } from './settings.service';

/**
 * Website settings edited in the admin panel. Reads are public (the website renders them);
 * saves need an admin, and SiteRevalidateInterceptor refreshes the website within seconds.
 */
@ApiTags('Website settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  /** Public: emails, phones, social links, addresses, business hours and Google links shown on the website. */
  @Public()
  @SkipThrottle()
  @Get('contact')
  async getContact() {
    return ok('Contact details fetched successfully.', await this.settings.getContact());
  }

  /** Replaces the contact details. */
  @Put('contact')
  async saveContact(@Body() dto: ContactSettingsDto) {
    return ok('Contact details saved. The website will update in a few seconds.', await this.settings.saveContact(dto));
  }

  /** Public: the "Technology" list (home page, hero and About page). */
  @Public()
  @SkipThrottle()
  @Get('tech')
  async getTech() {
    return ok('Technology list fetched successfully.', await this.settings.getTech());
  }

  /** Replaces the technology list. */
  @Put('tech')
  async saveTech(@Body() dto: TechStackDto) {
    return ok('Technology list saved. The website will update in a few seconds.', await this.settings.saveTech(dto));
  }

  /** Public: MECA's board (message, highlight, link and repeat interval). */
  @Public()
  @SkipThrottle()
  @Get('meca-board')
  async getMecaBoard() {
    return ok('Robot board fetched successfully.', await this.settings.getMecaBoard());
  }

  /** Replaces MECA's board. */
  @Put('meca-board')
  async saveMecaBoard(@Body() dto: MecaBoardDto) {
    return ok('Robot board saved. The website will update within a minute.', await this.settings.saveMecaBoard(dto));
  }
}
