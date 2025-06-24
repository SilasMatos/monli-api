import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) { }

  async create(userId: string, createAccountDto: CreateAccountDto): Promise<Account> {
    const existingAccount = await this.accountRepository.findOne({
      where: { userId },
    });

    if (existingAccount) {
      throw new ConflictException('Usuário já possui uma conta');
    }

    const account = this.accountRepository.create({
      userId,
      ...createAccountDto,
      currentBalance: createAccountDto.initialBalance || 0,
    });

    return this.accountRepository.save(account);
  }

  async findByUserId(userId: string): Promise<Account | null> {
    return this.accountRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async findById(id: string): Promise<Account | null> {
    return this.accountRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async update(userId: string, updateAccountDto: UpdateAccountDto): Promise<Account> {
    const account = await this.findByUserId(userId);

    if (!account) {
      throw new NotFoundException('Conta não encontrada');
    }

    // Não permitir alterar o saldo inicial se já foi definido
    if (updateAccountDto.initialBalance !== undefined && account.initialBalance > 0) {
      delete updateAccountDto.initialBalance;
    }

    Object.assign(account, updateAccountDto);
    return this.accountRepository.save(account);
  }

  async updateBalance(userId: string, newBalance: number): Promise<Account> {
    const account = await this.findByUserId(userId);

    if (!account) {
      throw new NotFoundException('Conta não encontrada');
    }

    account.currentBalance = newBalance;
    return this.accountRepository.save(account);
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<Account> {
    const account = await this.findByUserId(userId);

    if (!account) {
      throw new NotFoundException('Conta não encontrada');
    }

    account.avatar = avatarUrl;
    return this.accountRepository.save(account);
  }

  async toggleTwoFactor(userId: string): Promise<Account> {
    const account = await this.findByUserId(userId);

    if (!account) {
      throw new NotFoundException('Conta não encontrada');
    }

    account.twoFactorEnabled = !account.twoFactorEnabled;
    return this.accountRepository.save(account);
  }

  async deactivate(userId: string): Promise<Account> {
    const account = await this.findByUserId(userId);

    if (!account) {
      throw new NotFoundException('Conta não encontrada');
    }

    account.isActive = false;
    return this.accountRepository.save(account);
  }

  async activate(userId: string): Promise<Account> {
    const account = await this.findByUserId(userId);

    if (!account) {
      throw new NotFoundException('Conta não encontrada');
    }

    account.isActive = true;
    return this.accountRepository.save(account);
  }

  async findAll(): Promise<Account[]> {
    return this.accountRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAccountStats(userId: string) {
    const account = await this.findByUserId(userId);

    if (!account) {
      throw new NotFoundException('Conta não encontrada');
    }

    return {
      id: account.id,
      initialBalance: account.initialBalance,
      currentBalance: account.currentBalance,
      balanceVariation: account.currentBalance - account.initialBalance,
      isActive: account.isActive,
      twoFactorEnabled: account.twoFactorEnabled,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}