import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBannerDto } from './banner.dto';

const base = { name: 'Launch', description: 'New product', img: 'https://cdn.example.com/b.jpg', position: 1 };

async function check(extra: Record<string, unknown>) {
  const dto = plainToInstance(CreateBannerDto, { ...base, ...extra });
  const errors = await validate(dto);
  return { dto, fields: errors.map((e) => e.property) };
}

describe('CreateBannerDto details', () => {
  it('accepts a banner without any of the optional details', async () => {
    expect((await check({})).fields).toEqual([]);
  });

  it('trims highlights and drops empty ones', async () => {
    const { dto, fields } = await check({ highlights: ['  Fast  ', '', '  '] });
    expect(fields).toEqual([]);
    expect(dto.highlights).toEqual(['Fast']);
  });

  it('rejects more than four highlights or long ones', async () => {
    expect((await check({ highlights: ['a', 'b', 'c', 'd', 'e'] })).fields).toContain('highlights');
    expect((await check({ highlights: ['x'.repeat(61)] })).fields).toContain('highlights');
  });

  it('turns empty optional text into null so it can be cleared', async () => {
    const { dto, fields } = await check({ tag: '  ', cta_label: '', cta_link: '' });
    expect(fields).toEqual([]);
    expect(dto.tag).toBeNull();
    expect(dto.cta_label).toBeNull();
    expect(dto.cta_link).toBeNull();
  });

  it.each(['/contact', '/preview?industry=medical', 'https://mecatronix.one/work'])('accepts the link %s', async (link) => {
    expect((await check({ cta_label: 'Go', cta_link: link })).fields).toEqual([]);
  });

  it.each(['contact', '//evil.example.com', 'javascript:alert(1)', 'ftp://x.example.com'])('rejects the link %s', async (link) => {
    expect((await check({ cta_label: 'Go', cta_link: link })).fields).toContain('cta_link');
  });
});
