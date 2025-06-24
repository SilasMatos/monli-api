import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true, length: 500 })
  avatar: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  initialBalance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  currentBalance: number;

  @Column({ length: 20, default: 'light' })
  theme: string;

  @Column({ length: 10, default: 'pt-BR' })
  language: string;

  @Column({ length: 10, default: 'BRL' })
  currency: string;

  @Column({ default: true })
  notifications: boolean;

  @Column({ default: true })
  emailNotifications: boolean;

  @Column({ default: false })
  twoFactorEnabled: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}