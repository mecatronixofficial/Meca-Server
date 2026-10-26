import { Body, Controller, Get, HttpCode, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { CookieOptions, Response } from 'express';
import { ok } from '../common/api-response';
import { CurrentUser, Public } from '../common/decorators/auth.decorators';
import { AUTH_COOKIE, AuthUser } from '../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { ChangePasswordDto, ForgotPasswordDto, LoginDto, ResetPasswordDto, VerifyResetTokenDto } from './dto/auth.dto';
import { ApiTags } from '@nestjs/swagger';

/** Tighter limit for credential endpoints: 10 attempts per 15 minutes per IP. */
const CREDENTIAL_THROTTLE = { default: { limit: 10, ttl: 15 * 60 * 1000 } };

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Throttle(CREDENTIAL_THROTTLE)
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.auth.login(dto.email, dto.password);
    res.cookie(AUTH_COOKIE, token, { ...this.cookieOptions(), maxAge: this.config.get<number>('COOKIE_MAX_AGE_MS') });
    return ok('Login successful. Welcome back!', user);
  }

  @Get('check_login')
  async checkLogin(@CurrentUser() user: AuthUser) {
    return ok('Already logged in', await this.auth.profile(user.id));
  }

  @Post('change_password')
  @HttpCode(200)
  async changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    await this.auth.changePassword(user.id, dto.oldPassword, dto.newPassword);
    return ok('Password changed successfully.');
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE, this.cookieOptions());
    return ok('Logged out successfully');
  }

  @Public()
  @Throttle(CREDENTIAL_THROTTLE)
  @Post('forgot_password')
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.auth.forgotPassword(dto.email);
    return ok('If the account exists, a password reset email has been sent');
  }

  @Public()
  @Post('verifyresettoken')
  @HttpCode(200)
  async verifyResetToken(@Body() dto: VerifyResetTokenDto) {
    await this.auth.verifyResetToken(dto.token);
    return ok('Valid reset token');
  }

  @Public()
  @Throttle(CREDENTIAL_THROTTLE)
  @Post('reset_password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto.token, dto.newPassword);
    return ok('Password reset successful');
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      domain: this.config.get<string>('COOKIE_DOMAIN') || undefined,
      path: '/',
    };
  }
}
