import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactSettingsDto } from './dto/contact-settings.dto';
import { MecaBoardDto } from './dto/meca-board.dto';
import { TechStackDto } from './dto/tech-stack.dto';
import { SiteSetting } from './entities/site-setting.entity';

type ContactSettings = ContactSettingsDto;
type TechStack = TechStackDto;

/**
 * The Mecatronix Google Business profile on Google Maps (Place ID ChIJ2VtuRthZqDsRn2UPG3POkIQ, the
 * place behind the review QR code). A Place ID link always opens the business itself.
 */
const GOOGLE_PROFILE_URL =
  'https://www.google.com/maps/search/?api=1&query=Mecatronix%20Software%20Development&query_place_id=ChIJ2VtuRthZqDsRn2UPG3POkIQ';

/** Where the Mecatronix studio is on the map (from its Google Business profile). */
const STUDIO_POSITION = { lat: 11.0198784, lng: 76.9785856 };

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
      map_url: GOOGLE_PROFILE_URL,
      // The Google Business profile's position
      lat: STUDIO_POSITION.lat,
      lng: STUDIO_POSITION.lng,
    },
  ],
  hours: { days: 'Mon-Sat', open: '10:00', close: '19:00' },
  // The link in the printed "Scan to review us on Google" QR code
  review_url: 'https://g.page/r/CZ9lDxtzzpCEEAE/review',
  google_profile_url: GOOGLE_PROFILE_URL,
};

/** Optional links an older admin form may not send; a save without them keeps the saved ones. */
const KEPT_LINKS = ['review_url', 'google_profile_url'] as const;

/** The website's "Technology" list before it was editable; returned until an admin saves. */
export const DEFAULT_TECH: TechStack = {
  groups: [
    { category: 'Frontend', items: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'] },
    { category: 'Backend', items: ['Node.js', 'NestJS', 'REST APIs'] },
    { category: 'Databases', items: ['PostgreSQL', 'MongoDB'] },
    { category: 'Mobile', items: ['React Native'] },
    { category: 'Cloud & Deployment', items: ['Vercel', 'Cloudflare', 'Managed cloud hosting'] },
  ],
};

/** MECA's board before an admin edits it. */
export const DEFAULT_MECA_BOARD: MecaBoardDto = {
  enabled: true,
  text: 'Preview your website for free',
  highlight: 'free',
  link: '/preview',
  interval_minutes: 3,
};

const CONTACT_KEY = 'contact';
const TECH_KEY = 'tech';
const MECA_BOARD_KEY = 'meca_board';

/** Plain object (no class instances), so the jsonb column round-trips cleanly. */
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

@Injectable()
export class SettingsService {
  constructor(@InjectRepository(SiteSetting) private readonly settings: Repository<SiteSetting>) {}

  /** Saved contact details, or the defaults (with `updatedAt: null`) until an admin saves them. */
  async getContact(): Promise<ContactSettings & { updatedAt: Date | null }> {
    const row = await this.settings.findOneBy({ key: CONTACT_KEY });
    if (!row) return { ...DEFAULT_CONTACT, updatedAt: null };
    // Rows saved before a link existed get the default one
    const defaults = Object.fromEntries(KEPT_LINKS.map((key) => [key, DEFAULT_CONTACT[key]]));
    return { ...defaults, ...(row.value as ContactSettings), updatedAt: row.updatedAt };
  }

  async saveContact(dto: ContactSettingsDto) {
    const platforms = dto.socials.map((s) => s.platform);
    if (new Set(platforms).size !== platforms.length) throw new BadRequestException('Each social platform can only be added once');
    if (dto.hours.open >= dto.hours.close) throw new BadRequestException('Closing time must be after opening time');

    const current = await this.getContact();
    const kept = Object.fromEntries(KEPT_LINKS.map((key) => [key, dto[key] ?? current[key]]));
    await this.settings.save({ key: CONTACT_KEY, value: plain({ ...dto, ...kept }) });
    return this.getContact();
  }

  /** Saved "Technology" list, or the defaults (with `updatedAt: null`) until an admin saves it. */
  async getTech(): Promise<TechStack & { updatedAt: Date | null }> {
    const row = await this.settings.findOneBy({ key: TECH_KEY });
    return row ? { ...(row.value as TechStack), updatedAt: row.updatedAt } : { ...DEFAULT_TECH, updatedAt: null };
  }

  async saveTech(dto: TechStackDto) {
    const categories = dto.groups.map((g) => g.category.toLowerCase());
    if (new Set(categories).size !== categories.length) throw new BadRequestException('Each technology group can only be added once');
    // Drop repeats within a group (case-insensitive), keeping the first spelling
    const groups = dto.groups.map((g) => ({
      category: g.category,
      items: g.items.filter((item, i) => g.items.findIndex((other) => other.toLowerCase() === item.toLowerCase()) === i),
    }));
    await this.settings.save({ key: TECH_KEY, value: plain({ groups }) });
    return this.getTech();
  }

  /** Saved MECA board, or the default (with `updatedAt: null`) until an admin saves it. */
  async getMecaBoard(): Promise<MecaBoardDto & { updatedAt: Date | null }> {
    const row = await this.settings.findOneBy({ key: MECA_BOARD_KEY });
    return row ? { ...DEFAULT_MECA_BOARD, ...(row.value as MecaBoardDto), updatedAt: row.updatedAt } : { ...DEFAULT_MECA_BOARD, updatedAt: null };
  }

  async saveMecaBoard(dto: MecaBoardDto) {
    if (dto.highlight && !dto.text.toLowerCase().includes(dto.highlight.toLowerCase())) {
      throw new BadRequestException('The highlighted word must appear in the board text');
    }
    await this.settings.save({ key: MECA_BOARD_KEY, value: plain(dto) });
    return this.getMecaBoard();
  }
}
