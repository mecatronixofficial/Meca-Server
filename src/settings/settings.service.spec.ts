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
});
