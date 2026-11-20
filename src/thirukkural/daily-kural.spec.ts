import { indiaDate, kuralNumberForDate, nextChangeAt } from './daily-kural';
import { loadThirukkuralData } from './thirukkural.data';

describe('daily kural', () => {
  it('uses the India date, so it changes at midnight IST rather than UTC', () => {
    expect(indiaDate(new Date('2026-11-11T18:29:59Z'))).toBe('2026-11-11'); // 23:59:59 IST
    expect(indiaDate(new Date('2026-11-11T18:30:00Z'))).toBe('2026-11-12'); // 00:00 IST
  });

  it('moves to the next kural each day and wraps from 1330 back to 1', () => {
    const today = kuralNumberForDate('2026-11-11');
    expect(kuralNumberForDate('2026-11-12')).toBe((today % 1330) + 1);

    // Day 0 (1970-01-01) is kural 1; day 1329 is kural 1330; day 1330 starts over.
    expect(kuralNumberForDate('1970-01-01')).toBe(1);
    expect(kuralNumberForDate('1973-08-22')).toBe(1330);
    expect(kuralNumberForDate('1973-08-23')).toBe(1);
  });

  it('always lands on a valid kural', () => {
    for (let day = 0; day < 1400; day++) {
      const date = new Date(Date.UTC(2026, 0, 1 + day)).toISOString().slice(0, 10);
      const n = kuralNumberForDate(date);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(1330);
    }
  });

  it('reports the next change as the following midnight in India', () => {
    expect(nextChangeAt('2026-11-11').toISOString()).toBe('2026-11-11T18:30:00.000Z');
  });
});

describe('Thirukkural seed data', () => {
  const { chapters, kurals } = loadThirukkuralData();

  it('has all 1330 kurals, numbered 1-1330, each with text and explanations', () => {
    expect(kurals.map((k) => k.number)).toEqual(Array.from({ length: 1330 }, (_, i) => i + 1));
    for (const k of kurals) {
      for (const field of ['line1', 'line2', 'translation', 'explanation', 'urai_mv', 'urai_sp', 'urai_mk'] as const) {
        expect(k[field].trim()).not.toBe('');
      }
    }
  });

  it('has 133 chapters of 10 kurals, each kural in its chapter', () => {
    expect(chapters).toHaveLength(133);
    chapters.forEach((c, i) => {
      expect(c.number).toBe(i + 1);
      expect([c.start_kural, c.end_kural]).toEqual([i * 10 + 1, i * 10 + 10]);
    });
    for (const k of kurals) expect(k.chapter_number).toBe(Math.ceil(k.number / 10));
    expect(new Set(chapters.map((c) => c.paal_number)).size).toBe(3);
    expect(new Set(chapters.map((c) => c.iyal_number)).size).toBe(13);
  });
});
