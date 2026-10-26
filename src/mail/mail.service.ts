import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ejs from 'ejs';
import path from 'path';
import { Resend } from 'resend';

export const MAIL_TEMPLATES = [
  'adminDeleted',
  'enquiry',
  'enquiryUser',
  'invoice',
  'newAdmin',
  'newsletter',
  'passwordChanged',
  'passwordReset',
  'passwordSuccess',
  'passwordUpdated',
  'voucher',
] as const;

export type MailTemplate = (typeof MAIL_TEMPLATES)[number];

export interface MailMessage {
  to: string;
  subject: string;
  template: MailTemplate;
  data?: Record<string, unknown>;
  /** Where replies go, e.g. the visitor's address on an enquiry notification. */
  replyTo?: string;
  /** Extra headers, e.g. List-Unsubscribe for newsletters. */
  headers?: Record<string, string>;
}

/** Shared values every template can use as `brand.*`. */
export interface MailBrand {
  name: string;
  tagline: string;
  website: string;
  websiteLabel: string;
  supportEmail: string;
  year: number;
}

/** Resend accepts at most 100 emails per batch request. */
const BATCH_LIMIT = 100;
export const EMAIL_TEMPLATES_DIR = path.join(process.cwd(), 'views', 'emails');

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend?: Resend;

  constructor(private readonly config: ConfigService) {
    const apiKey = config.get<string>('RESEND_API_KEY')?.trim();
    if (apiKey) this.resend = new Resend(apiKey);
    else this.logger.warn('RESEND_API_KEY is not set; outgoing email is disabled.');
  }

  get enabled(): boolean {
    return !!this.resend;
  }

  /** Sends one email and throws if delivery fails. Use when the caller's result depends on delivery. */
  async send(message: MailMessage) {
    const resend = this.client();
    const result = await resend.emails.send(await this.toPayload(message));
    if (result.error) throw new ServiceUnavailableException(`Email delivery failed: ${result.error.message}`);
    return result.data;
  }

  /** Sends one email but never throws; failures are logged. Use for notifications that must not fail the request. */
  async trySend(message: MailMessage): Promise<boolean> {
    try {
      await this.send(message);
      return true;
    } catch (error) {
      this.logger.warn(`Email "${message.template}" to ${message.to} failed: ${(error as Error).message}`);
      return false;
    }
  }

  /** Sends many emails through Resend's batch API. Never throws; returns how many were accepted. */
  async sendMany(messages: MailMessage[]): Promise<{ sent: number; failed: number }> {
    if (!messages.length) return { sent: 0, failed: 0 };
    let sent = 0;

    for (let i = 0; i < messages.length; i += BATCH_LIMIT) {
      const chunk = messages.slice(i, i + BATCH_LIMIT);
      try {
        const resend = this.client();
        const result = await resend.batch.send(await Promise.all(chunk.map((message) => this.toPayload(message))));
        if (result.error) throw new Error(result.error.message);
        sent += chunk.length;
      } catch (error) {
        this.logger.warn(`Batch ${i / BATCH_LIMIT + 1} of ${chunk.length} email(s) failed: ${(error as Error).message}`);
      }
    }
    return { sent, failed: messages.length - sent };
  }

  /** Renders a template to HTML with the shared brand values. Also used by the dev preview page. */
  render(template: MailTemplate, data: Record<string, unknown> = {}): Promise<string> {
    return ejs.renderFile(path.join(EMAIL_TEMPLATES_DIR, `${template}.ejs`), { brand: this.brand(), ...data });
  }

  brand(): MailBrand {
    const website = this.config.get<string>('CLIENT_URL') || 'https://mecatronix.com';
    return {
      name: (this.config.get<string>('APP_NAME') || 'Mecatronix').toUpperCase(),
      tagline: 'Innovation Redefined',
      website,
      websiteLabel: website.replace(/^https?:\/\//, '').replace(/\/$/, ''),
      supportEmail: this.config.get<string>('ADMIN_EMAIL') ?? '',
      year: new Date().getFullYear(),
    };
  }

  private async toPayload({ to, subject, template, data = {}, replyTo, headers }: MailMessage) {
    return {
      from: this.config.getOrThrow<string>('MAIL_FROM'),
      to,
      subject,
      html: await this.render(template, data),
      ...(replyTo ? { replyTo } : {}),
      ...(headers ? { headers } : {}),
      tags: [{ name: 'template', value: template }],
    };
  }

  private client(): Resend {
    if (!this.resend) {
      throw new ServiceUnavailableException('Email service is not configured. Set RESEND_API_KEY and a verified MAIL_FROM address.');
    }
    return this.resend;
  }
}
