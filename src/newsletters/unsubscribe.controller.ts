import { Controller, Get, HttpCode, Post, Query, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AppUrls } from '../common/app-urls';
import { Public } from '../common/decorators/auth.decorators';
import { NewslettersService } from './newsletters.service';

/** HTML pages behind the unsubscribe link in newsletter and voucher emails. */
@ApiExcludeController()
@Public()
@Controller('news/unsubscribe')
export class UnsubscribeController {
  constructor(
    private readonly newsletters: NewslettersService,
    private readonly urls: AppUrls,
  ) {}

  @Get()
  confirm(@Query('email') email: string, @Query('token') token: string, @Req() req: Request, @Res() res: Response) {
    if (!this.newsletters.isValidLink(email, token)) return this.invalid(res);
    res.render('pages/unsubscribe', { email, actionUrl: req.originalUrl });
  }

  /** Handles the confirm button and RFC 8058 one-click requests from mail clients. */
  @Post()
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 15 * 60 * 1000 } })
  async unsubscribe(@Query('email') email: string, @Query('token') token: string, @Res() res: Response) {
    if (!(await this.newsletters.unsubscribe(email, token))) return this.invalid(res);
    res.render('pages/message', {
      title: 'Unsubscribed',
      tone: 'success',
      heading: "You've been unsubscribed",
      message: `${email} will no longer receive our newsletter. Changed your mind? You can subscribe again on our website.`,
      action: { href: this.urls.website, label: 'Back to the website' },
    });
  }

  private invalid(res: Response) {
    res.status(400).render('pages/message', {
      title: 'Invalid link',
      tone: 'error',
      heading: 'This unsubscribe link is not valid',
      message: 'The link may be incomplete. Please use the unsubscribe link from the latest email you received from us.',
      action: { href: this.urls.website, label: 'Go to the website' },
    });
  }
}
