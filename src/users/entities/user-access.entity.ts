import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_accesses')
export class UserAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 45 })
  ipAddress: string;

  @Column({ length: 500, nullable: true })
  userAgent: string;

  @Column({ length: 50 })
  accessType: string; // 'login', 'register'

  @Column({ default: true })
  success: boolean;

  @CreateDateColumn()
  accessedAt: Date;
}