import { Body, Controller, Get, HttpCode, Param, Post, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AppUrls } from '../common/app-urls';
import { Public } from '../common/decorators/auth.decorators';
import { PASSWORD_MIN_LENGTH } from '../common/passwords';
import { AuthService } from './auth.service';

/**
 * Server-rendered password reset page, for admins without a reset screen in the admin app.
 * Point emails here with RESET_PASSWORD_URL=<API_URL>/mec-api/auth/reset-password.
 */
@ApiExcludeController()
@Public()
@Controller('auth/reset-password')
export class ResetPasswordPageController {
  constructor(
    private readonly auth: AuthService,
    private readonly urls: AppUrls,
  ) {}

  @Get(':token')
  async form(@Param('token') token: string, @Req() req: Request, @Res() res: Response) {
    if (!(await this.isValid(token))) return this.expired(res);
    res.render('pages/reset-password', { actionUrl: req.originalUrl, minLength: PASSWORD_MIN_LENGTH, error: null });
  }

  @Post(':token')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 15 * 60 * 1000 } })
  async submit(
    @Param('token') token: string,
    @Body() body: { password?: unknown; confirmPassword?: unknown },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!(await this.isValid(token))) return this.expired(res);

    const password = typeof body?.password === 'string' ? body.password : '';
    const confirm = typeof body?.confirmPassword === 'string' ? body.confirmPassword : '';
    const error =
      password.length < PASSWORD_MIN_LENGTH
        ? `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
        : password !== confirm
          ? 'The passwords do not match.'
          : null;
    if (error) return res.status(400).render('pages/reset-password', { actionUrl: req.originalUrl, minLength: PASSWORD_MIN_LENGTH, error });

    await this.auth.resetPassword(token, password);
    res.render('pages/message', {
      title: 'Password reset',
      tone: 'success',
      heading: 'Your password has been reset',
      message: 'You can now sign in to the admin panel with your new password.',
      action: { href: this.urls.adminLogin, label: 'Go to sign-in' },
    });
  }

  private isValid(token: string): Promise<boolean> {
    return this.auth.verifyResetToken(token).then(
      () => true,
      () => false,
    );
  }

  private expired(res: Response) {
    res.status(400).render('pages/message', {
      title: 'Link expired',
      tone: 'error',
      heading: 'This reset link has expired',
      message: 'Reset links work once and expire after 10 minutes. Request a new one from the sign-in page.',
      action: { href: this.urls.adminLogin, label: 'Go to sign-in' },
    });
  }
}
