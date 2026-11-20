import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import { ContactSettingsDto } from './dto/contact-settings.dto';
import { SiteSetting } from './entities/site-setting.entity';
import { DEFAULT_CONTACT, SettingsService } from './settings.service';

const valid = () => JSON.parse(JSON.stringify(DEFAULT_CONTACT)) as ContactSettingsDto;

const errorsFor = async (input: unknown) => {
  const errors = await validate(plainToInstance(ContactSettingsDto, input));
  const flatten = (list: typeof errors): string[] => list.flatMap((e) => [...Object.values(e.constraints ?? {}), ...flatten(e.children ?? [])]);
  return flatten(errors);
};

describe('SettingsService (contact)', () => {
  let rows: Map<string, SiteSetting>;
  let service: SettingsService;

  beforeEach(() => {
    rows = new Map();
    const repo = {
      findOneBy: ({ key }: { key: string }) => Promise.resolve(rows.get(key) ?? null),
      save: (row: { key: string; value: unknown }) => {
        rows.set(row.key, { ...row, updatedAt: new Date('2026-11-11T10:00:00Z') });
        return Promise.resolve(row);
      },
    } as unknown as Repository<SiteSetting>;
    service = new SettingsService(repo);
  });

  it('returns the current website details until an admin saves', async () => {
    await expect(service.getContact()).resolves.toEqual({ ...DEFAULT_CONTACT, updatedAt: null });
  });

  it('saves and returns the new details', async () => {
    const dto = valid();
    dto.emails = [{ label: 'Sales', email: 'sales@mecatronix.one' }];
    const saved = await service.saveContact(dto);
    expect(saved.emails).toEqual([{ label: 'Sales', email: 'sales@mecatronix.one' }]);
    expect(saved.updatedAt).toBeInstanceOf(Date);
  });

  it('rejects the same social platform twice', async () => {
    const dto = valid();
    dto.socials = [dto.socials[0], { ...dto.socials[0] }];
    await expect(service.saveContact(dto)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects closing before opening', async () => {
    const dto = valid();
    dto.hours = { days: 'Mon-Sat', open: '19:00', close: '10:00' };
    await expect(service.saveContact(dto)).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('ContactSettingsDto', () => {
  it('accepts the default details', async () => {
    await expect(errorsFor(valid())).resolves.toEqual([]);
  });

  it('requires at least one email, phone and address', async () => {
    const errors = await errorsFor({ ...valid(), emails: [], phones: [], addresses: [] });
    expect(errors).toEqual(expect.arrayContaining(['Add at least one email address', 'Add at least one phone number', 'Add at least one address']));
  });

  it('rejects bad emails, links and times', async () => {
    const input = valid();
    input.emails[0].email = 'not-an-email';
    input.socials[0].url = 'instagram.com/mecatronix';
    input.hours.open = '9am';
    const errors = await errorsFor(input);
    expect(errors).toEqual(
      expect.arrayContaining([
        'Each email must be a valid email address',
        'Each social link must be a full URL starting with https://',
        'Opening time must look like 10:00',
      ]),
    );
  });

  it('allows an address without a map link', async () => {
    const input = valid();
    input.addresses[0].map_url = '';
    await expect(errorsFor(input)).resolves.toEqual([]);
  });

  it('takes an address position as both coordinates or neither', async () => {
    const none = valid();
    delete none.addresses[0].lat;
    delete none.addresses[0].lng;
    await expect(errorsFor(none)).resolves.toEqual([]);

    const half = valid();
    half.addresses[0].lng = null;
    await expect(errorsFor(half)).resolves.toEqual(['Longitude must be between -180 and 180 (and given with latitude)']);

    const outOfRange = valid();
    outOfRange.addresses[0].lat = 123;
    await expect(errorsFor(outOfRange)).resolves.toEqual(['Latitude must be between -90 and 90 (and given with longitude)']);
  });

  it('accepts a missing or blank review link and rejects a bad one', async () => {
    const { review_url: _omit, ...withoutReview } = valid();
    await expect(errorsFor(withoutReview)).resolves.toEqual([]);
    await expect(errorsFor({ ...valid(), review_url: '' })).resolves.toEqual([]);
    await expect(errorsFor({ ...valid(), review_url: 'g.page/r/abc/review' })).resolves.toEqual(['Google review link must be a full URL starting with https://']);
  });
});

describe('SettingsService (review link)', () => {
  let rows: Map<string, SiteSetting>;
  let service: SettingsService;

  beforeEach(() => {
    rows = new Map();
    const repo = {
      findOneBy: ({ key }: { key: string }) => Promise.resolve(rows.get(key) ?? null),
      save: (row: { key: string; value: unknown }) => {
        rows.set(row.key, { ...row, updatedAt: new Date('2026-11-20T10:00:00Z') } as SiteSetting);
        return Promise.resolve(row);
      },
    } as unknown as Repository<SiteSetting>;
    service = new SettingsService(repo);
  });

  it('defaults to the QR code link', async () => {
    await expect(service.getContact()).resolves.toMatchObject({ review_url: 'https://g.page/r/CZ9lDxtzzpCEEAE/review' });
  });

  it('saves a new link, and keeps it when a later save leaves it out', async () => {
    await service.saveContact({ ...valid(), review_url: 'https://g.page/r/NEW/review' });
    const { review_url: _omit, ...withoutReview } = valid();
    const saved = await service.saveContact(withoutReview as ContactSettingsDto);
    expect(saved.review_url).toBe('https://g.page/r/NEW/review');
  });

  it('gives details saved before the links existed the default links', async () => {
    const { review_url: _r, google_profile_url: _g, ...old } = valid();
    rows.set('contact', { key: 'contact', value: old, updatedAt: new Date() } as SiteSetting);
    await expect(service.getContact()).resolves.toMatchObject({
      review_url: DEFAULT_CONTACT.review_url,
      google_profile_url: DEFAULT_CONTACT.google_profile_url,
    });
  });

  it('defaults the Google profile link to the business Place ID, and keeps a saved one', async () => {
    expect(DEFAULT_CONTACT.google_profile_url).toContain('query_place_id=ChIJ2VtuRthZqDsRn2UPG3POkIQ');
    await service.saveContact({ ...valid(), google_profile_url: 'https://maps.google.com/?cid=1' });
    const { google_profile_url: _omit, ...withoutProfile } = valid();
    const saved = await service.saveContact(withoutProfile as ContactSettingsDto);
    expect(saved.google_profile_url).toBe('https://maps.google.com/?cid=1');
  });
});

describe('SettingsService (tech)', () => {
  let rows: Map<string, SiteSetting>;
  let service: SettingsService;

  beforeEach(() => {
    rows = new Map();
    const repo = {
      findOneBy: ({ key }: { key: string }) => Promise.resolve(rows.get(key) ?? null),
      save: (row: { key: string; value: unknown }) => {
        rows.set(row.key, { ...row, updatedAt: new Date('2026-11-20T10:00:00Z') } as SiteSetting);
        return Promise.resolve(row);
      },
    } as unknown as Repository<SiteSetting>;
    service = new SettingsService(repo);
  });

  it('returns the current website list until an admin saves', async () => {
    await expect(service.getTech()).resolves.toEqual({ ...DEFAULT_TECH, updatedAt: null });
  });

  it('saves the list, dropping repeated technologies in a group', async () => {
    const saved = await service.saveTech({ groups: [{ category: 'Frontend', items: ['React', 'react', 'Vue.js'] }] });
    expect(saved.groups).toEqual([{ category: 'Frontend', items: ['React', 'Vue.js'] }]);
    expect(saved.updatedAt).toBeInstanceOf(Date);
  });

  it('rejects the same group twice', async () => {
    await expect(
      service.saveTech({ groups: [{ category: 'Mobile', items: ['Flutter'] }, { category: 'mobile', items: ['React Native'] }] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('SettingsService (MECA board)', () => {
  let rows: Map<string, SiteSetting>;
  let service: SettingsService;

  beforeEach(() => {
    rows = new Map();
    const repo = {
      findOneBy: ({ key }: { key: string }) => Promise.resolve(rows.get(key) ?? null),
      save: (row: { key: string; value: unknown }) => {
        rows.set(row.key, { ...row, updatedAt: new Date('2026-11-20T10:00:00Z') } as SiteSetting);
        return Promise.resolve(row);
      },
    } as unknown as Repository<SiteSetting>;
    service = new SettingsService(repo);
  });

  it('defaults to "Preview your website for free", every 3 minutes', async () => {
    await expect(service.getMecaBoard()).resolves.toEqual({
      enabled: true,
      text: 'Preview your website for free',
      highlight: 'free',
      link: '/preview',
      interval_minutes: 3,
      updatedAt: null,
    });
  });

  it('saves a new board', async () => {
    const saved = await service.saveMecaBoard({ ...DEFAULT_MECA_BOARD, text: 'Get a FREE quote today', highlight: 'free', interval_minutes: 5 });
    expect(saved).toMatchObject({ text: 'Get a FREE quote today', interval_minutes: 5 });
    expect(saved.updatedAt).toBeInstanceOf(Date);
  });

  it('rejects a highlight that is not in the text', async () => {
    await expect(service.saveMecaBoard({ ...DEFAULT_MECA_BOARD, highlight: 'cheap' })).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('MecaBoardDto', () => {
  const boardErrors = async (input: unknown) => {
    const errors = await validate(plainToInstance(MecaBoardDto, input));
    return errors.flatMap((e) => Object.values(e.constraints ?? {}));
  };

  it('accepts the default board, a blank highlight and a full URL', async () => {
    await expect(boardErrors({ ...DEFAULT_MECA_BOARD })).resolves.toEqual([]);
    await expect(boardErrors({ ...DEFAULT_MECA_BOARD, highlight: '', link: 'https://mecatronix.one/preview' })).resolves.toEqual([]);
  });

  it('rejects bad links and intervals', async () => {
    for (const link of ['preview', '//evil.example.com', 'javascript:alert(1)']) {
      await expect(boardErrors({ ...DEFAULT_MECA_BOARD, link })).resolves.toEqual([
        'Board link must be a site path like /preview or a full URL starting with https://',
      ]);
    }
    await expect(boardErrors({ ...DEFAULT_MECA_BOARD, interval_minutes: 0 })).resolves.toEqual(['Interval must be at least 1 minute']);
  });
});

describe('TechStackDto', () => {
  const techErrors = async (input: unknown) => {
    const errors = await validate(plainToInstance(TechStackDto, input));
    const flatten = (list: typeof errors): string[] => list.flatMap((e) => [...Object.values(e.constraints ?? {}), ...flatten(e.children ?? [])]);
    return flatten(errors);
  };

  it('accepts the default list', async () => {
    await expect(techErrors(JSON.parse(JSON.stringify(DEFAULT_TECH)))).resolves.toEqual([]);
  });

  it('rejects empty groups, names and lists', async () => {
    await expect(techErrors({ groups: [] })).resolves.toContain('Add at least one technology group');
    const errors = await techErrors({ groups: [{ category: ' ', items: [] }] });
    expect(errors).toEqual(expect.arrayContaining(['Each group needs a name, e.g. "Frontend"', 'Each group needs at least one technology']));
  });
});
