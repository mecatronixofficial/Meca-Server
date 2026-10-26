import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AppUrls } from '../common/app-urls';
import { applySearch, ListQueryDto, paginate, PageMeta } from '../common/pagination';
import { MailService } from '../mail/mail.service';
import { Newsletter } from './entities/newsletter.entity';
import { isValidUnsubscribeToken, unsubscribeToken } from './unsubscribe-token';

export interface SubscriberStats {
  total: number;
  subscribers: Array<Newsletter & { date: string }>;
  /** `_id` holds the day (YYYY-MM-DD); the key name is kept for the existing admin client. */
  dailyStats: Array<{ _id: string; count: number }>;
  /** Present only when `page`/`limit` was requested. */
  meta?: PageMeta;
}

const day = (date: Date) => date.toISOString().slice(0, 10);

@Injectable()
export class NewslettersService {
  constructor(
    @InjectRepository(Newsletter) private readonly subscribers: Repository<Newsletter>,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly urls: AppUrls,
  ) {}

  async subscribe(email: string) {
    if (await this.subscribers.existsBy({ email })) throw new ConflictException('Email already subscribed');
    const subscriber = await this.subscribers.save(this.subscribers.create({ email }));
    await this.mail.trySend({
      to: email,
      subject: 'Welcome to the Mecatronix Newsletter!',
      template: 'newsletter',
      data: { unsubscribeUrl: this.unsubscribeUrl(email) },
      headers: this.unsubscribeHeaders(email),
    });
    return subscriber;
  }

  async stats(query: ListQueryDto): Promise<SubscriberStats> {
    const [total, daily] = await Promise.all([
      this.subscribers.count(),
      this.subscribers
        .createQueryBuilder('n')
        .select(`to_char(n."subscribedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD')`, 'day')
        .addSelect('COUNT(*)::int', 'count')
        .groupBy('day')
        .orderBy('day', 'DESC')
        .getRawMany<{ day: string; count: number }>(),
    ]);

    const qb = applySearch(this.subscribers.createQueryBuilder('n').orderBy('n.subscribedAt', 'DESC'), ['n.email'], query.search);
    const result = await paginate(qb, query);
    const rows = Array.isArray(result) ? result : result.items;
    return {
      total,
      subscribers: rows.map((row) => ({ ...row, date: day(row.subscribedAt) })),
      dailyStats: daily.map(({ day: _id, count }) => ({ _id, count: Number(count) })),
      ...(Array.isArray(result) ? {} : { meta: result.meta }),
    };
  }

  async removeMany(ids: string[]): Promise<number> {
    const { affected } = await this.subscribers.delete({ id: In(ids) });
    if (!affected) throw new NotFoundException('No subscribers found to delete');
    return affected;
  }

  /** Removes a subscriber via a signed unsubscribe link. Returns false when the link is invalid. */
  async unsubscribe(email: string, token: string | undefined): Promise<boolean> {
    if (!this.isValidLink(email, token)) return false;
    await this.subscribers.delete({ email: email.trim().toLowerCase() });
    return true;
  }

  isValidLink(email: string, token: string | undefined): boolean {
    return isValidUnsubscribeToken(email, token, this.secret());
  }

  unsubscribeUrl(email: string): string {
    const params = new URLSearchParams({ email, token: unsubscribeToken(email, this.secret()) });
    return `${this.urls.apiRoute('news/unsubscribe')}?${params}`;
  }

  /** RFC 8058 one-click unsubscribe headers; Gmail and Yahoo require them for bulk senders. */
  unsubscribeHeaders(email: string): Record<string, string> {
    return { 'List-Unsubscribe': `<${this.unsubscribeUrl(email)}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' };
  }

  async emails(): Promise<string[]> {
    const rows = await this.subscribers.find({ select: { email: true } });
    return rows.map((row) => row.email);
  }

  count() {
    return this.subscribers.count();
  }

  private secret(): string {
    return this.config.getOrThrow<string>('JWT_SECRET');
  }
}
