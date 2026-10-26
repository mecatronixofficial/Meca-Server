import type { InvoiceItemDto } from './dto/invoice.dto';
import type { InvoiceItem } from './entities/invoice.entity';

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Drops rows without a description and recomputes every amount server-side. */
export function calculateInvoice(rows: InvoiceItemDto[]): { items: InvoiceItem[]; subtotal: number; total: number } {
  const items = rows
    .filter((row) => row.desc?.trim())
    .map((row) => {
      const qty = Math.max(Number(row.qty) || 0, 0);
      const rate = Math.max(Number(row.rate) || 0, 0);
      return { desc: row.desc!.trim(), qty, rate, amount: round2(qty * rate) };
    });
  const subtotal = round2(items.reduce((sum, item) => sum + item.amount, 0));
  return { items, subtotal, total: subtotal };
}
