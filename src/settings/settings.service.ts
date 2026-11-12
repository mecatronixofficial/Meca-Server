import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactSettingsDto } from './dto/contact-settings.dto';
import { SiteSetting } from './entities/site-setting.entity';

type ContactSettings = ContactSettingsDto;

/** What the website showed before contact details were editable; returned until an admin saves. */
export const DEFAULT_CONTACT: ContactSettings = {
  emails: [
    { label: 'General enquiries', email: 'connect@mecatronix.one' },
    { label: 'Support', email: 'mecatronixofficial@gmail.com' },
  ],
  phones: [{ label: 'Studio', number: '+91 83004 54800', whatsapp: true }],
  socials: [
    { platform: 'instagram', url: 'https://www.instagram.com/mecatronixofficial/' },
    { platform: 'facebook', url: 'https://www.facebook.com/profile.php?id=61586332485916' },
    { platform: 'youtube', url: 'https://www.youtube.com/@Mecatronixsoftwaredevelopment' },
  ],
  addresses: [
    {
      label: 'Mecatronix Studio',
      street: 'No.3/12, Old ESI St, Sivasakthi Colony, Ganapathy',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641006',
      country: 'India',
      map_url: 'https://maps.app.goo.gl/yoaoHinWEJ3pqrQv8',
    },
  ],
  hours: { days: 'Mon-Sat', open: '10:00', close: '19:00' },
};

const CONTACT_KEY = 'contact';

@Injectable()
export class SettingsService {
  constructor(@InjectRepository(SiteSetting) private readonly settings: Repository<SiteSetting>) {}

  /** Saved contact details, or the defaults (with `updatedAt: null`) until an admin saves them. */
  async getContact(): Promise<ContactSettings & { updatedAt: Date | null }> {
    const row = await this.settings.findOneBy({ key: CONTACT_KEY });
    return row ? { ...(row.value as ContactSettings), updatedAt: row.updatedAt } : { ...DEFAULT_CONTACT, updatedAt: null };
  }

  async saveContact(dto: ContactSettingsDto) {
    const platforms = dto.socials.map((s) => s.platform);
    if (new Set(platforms).size !== platforms.length) throw new BadRequestException('Each social platform can only be added once');
    if (dto.hours.open >= dto.hours.close) throw new BadRequestException('Closing time must be after opening time');

    // Store a plain object (no class instances) so the jsonb column round-trips cleanly
    const value = JSON.parse(JSON.stringify(dto)) as ContactSettings;
    await this.settings.save({ key: CONTACT_KEY, value });
    return this.getContact();
  }
}
