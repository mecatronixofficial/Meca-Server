import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation, Unique } from 'typeorm';
import { Admin } from '../../admins/entities/admin.entity';

/** One-time password reset token. Only the SHA-256 hash of the emailed token is stored. */
@Entity('password_resets')
@Unique('password_resets_tokenHash_key', ['tokenHash'])
export class PasswordReset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('password_resets_user_idx')
  @Column('uuid')
  userId: string;

  /** Tokens are removed automatically when their admin is deleted. */
  @ManyToOne(() => Admin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', foreignKeyConstraintName: 'password_resets_userId_fkey' })
  user?: Relation<Admin>;

  @Column()
  tokenHash: string;

  @Index('password_resets_expiry_idx')
  @Column('timestamptz')
  expiresAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
