import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ok } from '../common/api-response';
import { Public } from '../common/decorators/auth.decorators';
import { ContactSettingsDto } from './dto/contact-settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('Website settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  /** Public: emails, phones, social links, addresses and business hours shown on the website. */
  @Public()
  @SkipThrottle()
  @Get('contact')
  async getContact() {
    return ok('Contact details fetched successfully.', await this.settings.getContact());
  }

  /** Replaces the contact details. The website refreshes within seconds (SiteRevalidateInterceptor). */
  @Put('contact')
  async saveContact(@Body() dto: ContactSettingsDto) {
    return ok('Contact details saved. The website will update in a few seconds.', await this.settings.saveContact(dto));
  }
}
