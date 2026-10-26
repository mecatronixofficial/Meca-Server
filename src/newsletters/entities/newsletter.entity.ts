import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('newsletters')
@Unique('newsletters_email_key', ['email'])
export class Newsletter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @CreateDateColumn({ type: 'timestamptz' })
  subscribedAt: Date;
}
