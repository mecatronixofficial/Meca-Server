import { Column, Entity, Unique } from 'typeorm';
import { TimestampedEntity } from '../../common/base.entity';

export enum AdminRole {
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
}

@Entity('admins')
@Unique('admins_email_key', ['email'])
export class Admin extends TimestampedEntity {
  @Column({ nullable: true })
  img?: string;

  @Column({ length: 100 })
  name: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  /** Never selected by default; load explicitly with `addSelect('a.password')`. */
  @Column({ select: false })
  password: string;

  @Column({ type: 'varchar', default: AdminRole.ADMIN })
  role: AdminRole;
}
