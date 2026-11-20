import { ReviewsController } from './reviews.controller';
import type { ReviewsService } from './reviews.service';

describe('ReviewsController.findAll', () => {
  const reviews = [
    { id: '1', user_name: 'Asha', user_email: 'asha@example.com', company_name: 'Acme', rating: 5, comment: 'Great', is_verified: true },
  ];
  const findAll = jest.fn();
  const controller = new ReviewsController({ findAll } as unknown as ReviewsService);

  beforeEach(() => findAll.mockReset().mockResolvedValue(reviews));

  it('gives anonymous visitors verified reviews only, without email addresses', async () => {
    const res = await controller.findAll({ verified: 'false' }, {});
    expect(findAll).toHaveBeenCalledWith({ verified: 'true' });
    expect(res.data).toEqual([expect.not.objectContaining({ user_email: expect.anything() })]);
    expect((res.data as { user_name: string }[])[0]?.user_name).toBe('Asha');
  });

  it('strips emails from paginated results too', async () => {
    findAll.mockResolvedValue({ items: reviews, meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    const res = await controller.findAll({ page: 1 }, {});
    expect((res.data as { items: object[] }).items[0]).not.toHaveProperty('user_email');
  });

  it('gives signed-in admins everything they ask for', async () => {
    const res = await controller.findAll({ verified: 'false' }, { user: { id: 'a', email: 'admin@example.com', role: 'admin' as never } });
    expect(findAll).toHaveBeenCalledWith({ verified: 'false' });
    expect(res.data).toBe(reviews);
  });
});
