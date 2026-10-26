import { calculateInvoice } from './invoice-totals';

describe('calculateInvoice', () => {
  it('drops blank rows and totals the rest', () => {
    const result = calculateInvoice([
      { desc: 'Design', qty: 2, rate: 1500 },
      { desc: '   ', qty: 1, rate: 999 },
      { desc: 'Hosting', qty: 1, rate: 499.99 },
    ]);
    expect(result.items.map((item) => item.desc)).toEqual(['Design', 'Hosting']);
    expect(result.total).toBe(3499.99);
  });

  it('rounds amounts to two decimals', () => {
    expect(calculateInvoice([{ desc: 'Hours', qty: 3, rate: 0.1 }]).items[0].amount).toBe(0.3);
  });
});
