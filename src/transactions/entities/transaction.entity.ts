import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Account } from '../../account/entities/account.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  accountId: string;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ length: 20 })
  type: string; // 'income', 'expense', 'transfer'

  @Column({ length: 50 })
  category: string;

  @Column({ length: 200 })
  description: string;

  @Column({ type: 'date' })
  transactionDate: Date;

  @Column({ length: 50, nullable: true })
  paymentMethod: string; // 'cash', 'card', 'pix', 'transfer'

  @Column({ length: 100, nullable: true })
  reference: string; // Referência externa, número do documento, etc.

  @Column({ type: 'uuid', nullable: true })
  transferAccountId: string; // Para transferências entre contas

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  balanceAfter: number; // Saldo após a transação

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ length: 20, nullable: true })
  recurringType: string; // 'daily', 'weekly', 'monthly', 'yearly'

  @Column({ type: 'json', nullable: true })
  tags: string[]; // Tags para categorização adicional

  @Column({ default: 'active' })
  status: string; // 'active', 'cancelled', 'pending'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}