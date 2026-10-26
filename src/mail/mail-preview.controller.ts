import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../common/decorators/auth.decorators';
import { MAIL_SAMPLES } from './mail-samples';
import { MAIL_TEMPLATES, MailService, MailTemplate } from './mail.service';

/** Development-only gallery of every email template rendered with sample data. Disabled in production. */
@ApiExcludeController()
@Public()
@Controller('mail/preview')
export class MailPreviewController {
  constructor(
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  index(@Res() res: Response) {
    this.assertEnabled();
    const links = MAIL_TEMPLATES.map((name) => `<li><a href="preview/${name}">${name}</a></li>`).join('');
    res
      .type('html')
      .send(
        `<!DOCTYPE html><meta charset="utf-8"><title>Email previews</title>` +
          `<body style="font:16px/1.6 system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px">` +
          `<h1>Email previews</h1><p>Each template rendered with sample data. Not available in production.</p><ul>${links}</ul></body>`,
      );
  }

  @Get(':template')
  async show(@Param('template') template: string, @Res() res: Response) {
    this.assertEnabled();
    if (!(MAIL_TEMPLATES as readonly string[]).includes(template)) throw new NotFoundException('Unknown email template');
    res.type('html').send(await this.mail.render(template as MailTemplate, MAIL_SAMPLES[template as MailTemplate]));
  }

  private assertEnabled() {
    if (this.config.get('NODE_ENV') === 'production') throw new NotFoundException();
  }
}
