import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppUrls } from '../common/app-urls';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { MoreThan, Repository } from 'typeorm';
import { Admin } from '../admins/entities/admin.entity';
import { AuthUser } from '../common/guards/jwt-auth.guard';
import { hashPassword, verifyPassword } from '../common/passwords';
import { MailService } from '../mail/mail.service';
import { PasswordReset } from './entities/password-reset.entity';

const RESET_TOKEN_TTL_MS = 10 * 60 * 1000;
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin) private readonly admins: Repository<Admin>,
    @InjectRepository(PasswordReset) private readonly resets: Repository<PasswordReset>,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly urls: AppUrls,
  ) {}

  async login(email: string, password: string): Promise<{ user: Admin; token: string }> {
    const admin = await this.withPassword().where('a.email = :email', { email }).getOne();
    // Same message for unknown email and wrong password so accounts cannot be enumerated.
    if (!admin || !(await verifyPassword(password, admin.password))) throw new UnauthorizedException('Invalid account details.');

    const payload: AuthUser = { id: admin.id, email: admin.email, role: admin.role };
    const { password: _hidden, ...user } = admin;
    return { user: user as Admin, token: await this.jwt.signAsync(payload) };
  }

  async profile(id: string): Promise<Admin> {
    const admin = await this.admins.findOneBy({ id });
    if (!admin) throw new UnauthorizedException('Account no longer exists. Please log in again.');
    return admin;
  }

  async changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
    const admin = await this.withPassword().where('a.id = :id', { id }).getOne();
    if (!admin || !(await verifyPassword(oldPassword, admin.password))) throw new BadRequestException('The password entered is incorrect.');
    await this.admins.update(admin.id, { password: await this.hash(newPassword) });
    await this.mail.trySend({
      to: admin.email,
      subject: 'Your Mecatronix password was changed',
      template: 'passwordChanged',
      data: { name: admin.name, timestamp: this.now(), resetUrl: this.urls.adminLogin },
    });
  }

  /** Always resolves without revealing whether the account exists. */
  async forgotPassword(email: string): Promise<void> {
    const admin = await this.admins.findOneBy({ email });
    if (!admin) return;

    const rawToken = randomBytes(32).toString('hex');
    await this.resets.delete({ userId: admin.id });
    await this.resets.save(
      this.resets.create({ userId: admin.id, tokenHash: sha256(rawToken), expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) }),
    );

    await this.mail.send({
      to: admin.email,
      subject: 'Reset Your Mecatronix Password',
      template: 'passwordReset',
      data: { resetLink: this.urls.resetPassword(rawToken), expiresInMinutes: RESET_TOKEN_TTL_MS / 60_000 },
    });
  }

  async verifyResetToken(token: string): Promise<PasswordReset> {
    const record = await this.resets.findOneBy({ tokenHash: sha256(token), expiresAt: MoreThan(new Date()) });
    if (!record) throw new BadRequestException('Invalid or expired reset link.');
    return record;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await this.verifyResetToken(token);
    const admin = await this.admins.findOneBy({ id: record.userId });
    if (!admin) throw new BadRequestException('Invalid or expired reset link.');

    await this.admins.update(admin.id, { password: await this.hash(newPassword) });
    await this.resets.delete({ userId: admin.id });
    await this.mail.trySend({
      to: admin.email,
      subject: 'Password reset successful',
      template: 'passwordSuccess',
      data: { timestamp: this.now(), loginUrl: this.urls.adminLogin },
    });
  }

  private now(): string {
    return new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST';
  }

  private withPassword() {
    return this.admins.createQueryBuilder('a').addSelect('a.password');
  }

  private hash(plain: string) {
    return hashPassword(plain, this.config.get<number>('BCRYPT_SALT_ROUNDS'));
  }
}
