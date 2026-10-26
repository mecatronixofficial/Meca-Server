import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { AppUrls } from '../common/app-urls';
import { AuthUser } from '../common/guards/jwt-auth.guard';
import { applySearch, ListQueryDto, ListResult, paginate } from '../common/pagination';
import { hashPassword } from '../common/passwords';
import { MailService } from '../mail/mail.service';
import { CreateAdminDto, UpdateAdminDto } from './dto/admin.dto';
import { Admin, AdminRole } from './entities/admin.entity';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admin) private readonly admins: Repository<Admin>,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly urls: AppUrls,
  ) {}

  async create(dto: CreateAdminDto): Promise<Admin> {
    await this.assertEmailFree(dto.email);
    const saved = await this.admins.save(this.admins.create({ ...dto, role: dto.role ?? AdminRole.ADMIN, password: await this.hash(dto.password) }));

    // The welcome email contains the initial password so the new admin can sign in.
    await this.mail.trySend({
      to: saved.email,
      subject: 'Your Mecatronix Admin Account Has Been Created',
      template: 'newAdmin',
      data: { name: saved.name, email: saved.email, phone: saved.phone, password: dto.password, role: saved.role, loginUrl: this.loginUrl() },
    });
    return this.findById(saved.id);
  }

  /** Lists regular admins. Superadmin accounts are intentionally hidden from the management list. */
  findAll(query: ListQueryDto): Promise<ListResult<Admin>> {
    const qb = this.admins.createQueryBuilder('a').where('a.role <> :role', { role: AdminRole.SUPERADMIN }).orderBy('a.createdAt', 'DESC');
    return paginate(applySearch(qb, ['a.name', 'a.email', 'a.phone'], query.search), query);
  }

  async findOne(id: string, actor: AuthUser): Promise<Admin> {
    this.assertSelfOrSuperadmin(id, actor);
    return this.findById(id);
  }

  async findById(id: string): Promise<Admin> {
    const admin = await this.admins.findOneBy({ id });
    if (!admin) throw new NotFoundException('Admin not found.');
    return admin;
  }

  async update(id: string, dto: UpdateAdminDto, actor: AuthUser): Promise<Admin> {
    this.assertSelfOrSuperadmin(id, actor);
    const admin = await this.findById(id);

    if (dto.role && dto.role !== admin.role) {
      if (actor.role !== AdminRole.SUPERADMIN) throw new ForbiddenException('Only a superadmin can change roles.');
      if (admin.role === AdminRole.SUPERADMIN) await this.assertNotLastSuperadmin(admin.id);
    }
    if (dto.email && dto.email !== admin.email) await this.assertEmailFree(dto.email, admin.id);

    const { password, ...changes } = dto;
    Object.assign(admin, changes);
    if (password) admin.password = await this.hash(password);
    await this.admins.save(admin);

    if (password) {
      await this.mail.trySend({
        to: admin.email,
        subject: 'Your Mecatronix Admin Password Has Been Updated',
        template: 'passwordUpdated',
        data: { name: admin.name, email: admin.email, password, loginUrl: this.loginUrl() },
      });
    }
    return this.findById(id);
  }

  async remove(id: string, actor: AuthUser): Promise<void> {
    if (id === actor.id) throw new BadRequestException('You cannot delete your own account.');
    const admin = await this.findById(id);
    if (admin.role === AdminRole.SUPERADMIN) await this.assertNotLastSuperadmin(admin.id);
    await this.admins.remove(admin);

    await this.mail.trySend({
      to: admin.email,
      subject: 'Admin Account Deleted - Mecatronix',
      template: 'adminDeleted',
      data: {
        name: admin.name,
        email: admin.email,
        role: admin.role,
        supportEmail: this.config.get<string>('ADMIN_EMAIL') ?? '',
        contactUrl: `${this.urls.website}/contact`,
      },
    });
  }

  countByRole(): Promise<Array<{ role: AdminRole; count: string }>> {
    return this.admins.createQueryBuilder('a').select('a.role', 'role').addSelect('COUNT(*)', 'count').groupBy('a.role').getRawMany();
  }

  private assertSelfOrSuperadmin(id: string, actor: AuthUser) {
    if (actor.role !== AdminRole.SUPERADMIN && actor.id !== id) throw new ForbiddenException('You can only access your own account.');
  }

  private async assertNotLastSuperadmin(excludingId: string) {
    const others = await this.admins.countBy({ role: AdminRole.SUPERADMIN, id: Not(excludingId) });
    if (others === 0) throw new BadRequestException('At least one superadmin account must remain.');
  }

  private async assertEmailFree(email: string, excludingId?: string) {
    const existing = await this.admins.findOneBy({ email: email.toLowerCase() });
    if (existing && existing.id !== excludingId) throw new ConflictException('An account with this email address already exists.');
  }

  private hash(plain: string) {
    return hashPassword(plain, this.config.get<number>('BCRYPT_SALT_ROUNDS'));
  }

  private loginUrl() {
    return this.urls.adminLogin;
  }
}
