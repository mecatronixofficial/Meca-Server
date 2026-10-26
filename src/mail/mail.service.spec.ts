import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MAIL_SAMPLES } from './mail-samples';
import { MAIL_TEMPLATES, MailService } from './mail.service';

describe('MailService', () => {
  const service = new MailService(
    new ConfigService({ RESEND_API_KEY: '', CLIENT_URL: 'https://mecatronix.com', ADMIN_EMAIL: 'team@mecatronix.com' }),
  );

  it('allows startup without Resend and reports configuration when sending', async () => {
    await expect(service.send({ to: 'user@example.com', subject: 'Test', template: 'passwordReset' })).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('does not throw from trySend when email is disabled', async () => {
    await expect(service.trySend({ to: 'user@example.com', subject: 'Test', template: 'passwordReset' })).resolves.toBe(false);
  });

  it('reports partial failure from sendMany instead of throwing', async () => {
    await expect(service.sendMany([{ to: 'a@example.com', subject: 'Hi', template: 'newsletter', data: MAIL_SAMPLES.newsletter }])).resolves.toEqual({
      sent: 0,
      failed: 1,
    });
  });

  describe.each(MAIL_TEMPLATES)('template "%s"', (template) => {
    it('renders with the shared layout and escapes user content', async () => {
      const html = await service.render(template, MAIL_SAMPLES[template]);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('MECATRONIX');
      expect(html).toContain('mecatronix.com');
      expect(html).toMatch(/<\/html>\s*$/);
    });
  });

  it('escapes HTML in user-supplied values', async () => {
    const html = await service.render('enquiryUser', { ...MAIL_SAMPLES.enquiryUser, message: '<script>alert(1)</script>' });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('adds an unsubscribe link to subscriber emails only', async () => {
    expect(await service.render('voucher', MAIL_SAMPLES.voucher)).toContain('Unsubscribe');
    expect(await service.render('passwordReset', MAIL_SAMPLES.passwordReset)).not.toContain('Unsubscribe');
  });
});
