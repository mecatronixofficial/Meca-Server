import { SelectQueryBuilder } from 'typeorm';
import { paginate } from './pagination';

const fakeQuery = (rows: number[]): SelectQueryBuilder<{ n: number }> => {
  const state = { skip: 0, take: rows.length };
  const qb: Record<string, unknown> = {};
  Object.assign(qb, {
    getMany: () => Promise.resolve(rows),
    skip: (n: number) => ((state.skip = n), qb),
    take: (n: number) => ((state.take = n), qb),
    getManyAndCount: () => Promise.resolve([rows.slice(state.skip, state.skip + state.take), rows.length]),
  });
  return qb as unknown as SelectQueryBuilder<{ n: number }>;
};

describe('paginate', () => {
  const rows = Array.from({ length: 45 }, (_, i) => i);

  it('returns a plain array when no page or limit is given', async () => {
    await expect(paginate(fakeQuery(rows), {})).resolves.toHaveLength(45);
  });

  it('returns the requested page with metadata', async () => {
    const result = await paginate(fakeQuery(rows), { page: 3, limit: 20 });
    expect(result).toEqual({ items: rows.slice(40), meta: { page: 3, limit: 20, total: 45, totalPages: 3 } });
  });

  it('defaults to page 1 when only limit is given', async () => {
    const result = (await paginate(fakeQuery(rows), { limit: 10 })) as { meta: { page: number } };
    expect(result.meta.page).toBe(1);
  });
});
