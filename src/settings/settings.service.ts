import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactSettingsDto } from './dto/contact-settings.dto';
import { MecaBoardDto } from './dto/meca-board.dto';
import { TechStackDto } from './dto/tech-stack.dto';
import { SiteSetting } from './entities/site-setting.entity';

type ContactSettings = ContactSettingsDto;
type TechStack = TechStackDto;
type MecaBoard = MecaBoardDto;
type Saved<T> = T & { updatedAt: Date | null };

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
      // Studio position from the Google Business profile (same as Meca-UI's default)
      lat: 11.0198784,
      lng: 76.9785856,
    },
  ],
  hours: { days: 'Mon-Sat', open: '10:00', close: '19:00' },
  // The printed review QR code
  review_url: 'https://g.page/r/CZ9lDxtzzpCEEAE/review',
  // The Google Business profile, opened by its Place ID so it always shows the business
  google_profile_url:
    'https://www.google.com/maps/search/?api=1&query=Mecatronix%20Software%20Development&query_place_id=ChIJ2VtuRthZqDsRn2UPG3POkIQ',
};

/** The website's "Technology" list before it was editable (Meca-UI src/data/company.ts). */
export const DEFAULT_TECH: TechStack = {
  groups: [
    { category: 'Frontend', items: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'] },
    { category: 'Backend', items: ['Node.js', 'NestJS', 'REST APIs'] },
    { category: 'Databases', items: ['PostgreSQL', 'MongoDB'] },
    { category: 'Mobile', items: ['React Native'] },
    { category: 'Cloud & Deployment', items: ['Vercel', 'Cloudflare', 'Managed cloud hosting'] },
  ],
};

/** MECA's board before it was editable (Meca-UI src/lib/meca-board.ts). */
export const DEFAULT_MECA_BOARD: MecaBoard = {
  enabled: true,
  text: 'Preview your website for free',
  highlight: 'free',
  link: '/preview',
  interval_minutes: 3,
};

const KEYS = { contact: 'contact', tech: 'tech', mecaBoard: 'meca_board' } as const;

/** Stores a plain object (no class instances) so the jsonb column round-trips cleanly. */
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

@Injectable()
export class SettingsService {
  constructor(@InjectRepository(SiteSetting) private readonly settings: Repository<SiteSetting>) {}

  /** The saved value for `key`, or `fallback` (with `updatedAt: null`) until an admin saves one. */
  private async read<T extends object>(key: string, fallback: T): Promise<Saved<T>> {
    const row = await this.settings.findOneBy({ key });
    return row ? { ...(row.value as T), updatedAt: row.updatedAt } : { ...fallback, updatedAt: null };
  }

  private async write(key: string, value: object) {
    await this.settings.save({ key, value: plain(value) });
  }

  /* ---------- Contact details ---------- */

  async getContact(): Promise<Saved<ContactSettings>> {
    const saved = await this.read(KEYS.contact, DEFAULT_CONTACT);
    // Details saved before these links existed (or saved blank) use the business defaults.
    return {
      ...saved,
      review_url: saved.review_url || DEFAULT_CONTACT.review_url,
      google_profile_url: saved.google_profile_url || DEFAULT_CONTACT.google_profile_url,
    };
  }

  async saveContact(dto: ContactSettingsDto) {
    const platforms = dto.socials.map((s) => s.platform);
    if (new Set(platforms).size !== platforms.length) throw new BadRequestException('Each social platform can only be added once');
    if (dto.hours.open >= dto.hours.close) throw new BadRequestException('Closing time must be after opening time');

    // Clients that don't know about the Google links (older admin builds) leave them out: keep the saved ones.
    const current = await this.getContact();
    await this.write(KEYS.contact, {
      ...dto,
      review_url: dto.review_url ?? current.review_url,
      google_profile_url: dto.google_profile_url ?? current.google_profile_url,
    });
    return this.getContact();
  }

  /* ---------- Technology list ---------- */

  getTech(): Promise<Saved<TechStack>> {
    return this.read(KEYS.tech, DEFAULT_TECH);
  }

  async saveTech(dto: TechStackDto) {
    const categories = dto.groups.map((group) => group.category.trim().toLowerCase());
    if (new Set(categories).size !== categories.length) throw new BadRequestException('Each technology group can only be added once');

    // Repeated technologies inside a group ("React", "react") keep their first spelling.
    const groups = dto.groups.map((group) => {
      const seen = new Set<string>();
      const items = group.items.filter((item) => {
        const id = item.trim().toLowerCase();
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      return { category: group.category.trim(), items };
    });

    await this.write(KEYS.tech, { groups });
    return this.getTech();
  }

  /* ---------- MECA's board ---------- */

  getMecaBoard(): Promise<Saved<MecaBoard>> {
    return this.read(KEYS.mecaBoard, DEFAULT_MECA_BOARD);
  }

  async saveMecaBoard(dto: MecaBoardDto) {
    if (dto.highlight && !dto.text.toLowerCase().includes(dto.highlight.toLowerCase())) {
      throw new BadRequestException('The highlighted word must appear in the board text');
    }
    await this.write(KEYS.mecaBoard, {
      enabled: dto.enabled,
      text: dto.text,
      highlight: dto.highlight,
      link: dto.link,
      interval_minutes: dto.interval_minutes,
    });
    return this.getMecaBoard();
  }
}
