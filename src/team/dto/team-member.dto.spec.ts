import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateTeamMemberDto } from './team-member.dto';

const base = { name: 'Asha', role: 'Founder & CEO', photo: 'https://cdn.example.com/team/asha.jpg' };

async function check(extra: Record<string, unknown>) {
  const dto = plainToInstance(CreateTeamMemberDto, { ...base, ...extra });
  return { dto, fields: (await validate(dto)).map((e) => e.property) };
}

describe('CreateTeamMemberDto', () => {
  it('needs only a name, role and photo', async () => {
    expect((await check({})).fields).toEqual([]);
  });

  it('requires a name, role and photo', async () => {
    expect((await check({ name: ' ', role: '', photo: '' })).fields.sort()).toEqual(['name', 'photo', 'role']);
  });

  it('accepts LinkedIn profile links only', async () => {
    expect((await check({ linkedin: 'https://www.linkedin.com/in/asha' })).fields).toEqual([]);
    expect((await check({ linkedin: 'https://in.linkedin.com/in/asha' })).fields).toEqual([]);
    expect((await check({ linkedin: 'https://evil.example.com/linkedin.com/in/x' })).fields).toContain('linkedin');
    expect((await check({ linkedin: 'http://linkedin.com/in/asha' })).fields).toContain('linkedin');
  });

  it('clears empty optional links and email', async () => {
    const { dto, fields } = await check({ linkedin: '', email: '  ' });
    expect(fields).toEqual([]);
    expect(dto.linkedin).toBeNull();
    expect(dto.email).toBeNull();
  });

  it('rejects an invalid email, a long bio and position 0', async () => {
    const { fields } = await check({ email: 'not-an-email', bio: 'x'.repeat(601), position: 0 });
    expect(fields.sort()).toEqual(['bio', 'email', 'position']);
  });
});
