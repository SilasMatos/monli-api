import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { AccountService } from '../account/services/account.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private accountService: AccountService,
  ) { }

  async create(userId: string, createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const account = await this.accountService.findByUserId(userId);

    if (!account) {
      throw new NotFoundException('Conta não encontrada');
    }

    const { amount, type, transferAccountId, ...transactionData } = createTransactionDto;

    // Validar transferência
    if (type === 'transfer' && !transferAccountId) {
      throw new BadRequestException('Conta de destino é obrigatória para transferências');
    }

    // Validar se há saldo suficiente para despesas e transferências
    if ((type === 'expense' || type === 'transfer') && account.currentBalance < amount) {
      throw new BadRequestException('Saldo insuficiente');
    }

    // Calcular novo saldo
    let newBalance = account.currentBalance;
    if (type === 'income') {
      newBalance += amount;
    } else if (type === 'expense' || type === 'transfer') {
      newBalance -= amount;
    }

    const transaction = this.transactionRepository.create({
      userId,
      accountId: account.id,
      amount,
      type,
      transferAccountId,
      balanceAfter: newBalance,
      isRecurring: !!transactionData.recurringType,
      ...transactionData,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Atualizar saldo da conta
    await this.accountService.updateBalance(userId, newBalance);

    // Se for transferência, criar transação de entrada na conta destino
    if (type === 'transfer' && transferAccountId) {
      const destinationAccount = await this.accountService.findById(transferAccountId);
      if (destinationAccount) {
        const destinationBalance = destinationAccount.currentBalance + amount;

        await this.transactionRepository.save({
          userId: destinationAccount.userId,
          accountId: transferAccountId,
          amount,
          type: 'income',
          category: 'transfer',
          description: `Transferência recebida de ${account.user.name}`,
          transactionDate: transactionData.transactionDate,
          balanceAfter: destinationBalance,
          reference: savedTransaction.id,
        });

        await this.accountService.updateBalance(destinationAccount.userId, destinationBalance);
      }
    }

    return this.findById(savedTransaction.id);
  }

  async findAll(userId: string, filterDto: TransactionFilterDto): Promise<{ transactions: Transaction[], total: number, page: number, limit: number }> {
    const { page = 1, limit = 20, startDate, endDate, minAmount, maxAmount, ...filters } = filterDto;

    const queryBuilder = this.transactionRepository.createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.account', 'account')
      .where('transaction.userId = :userId', { userId });

    // Aplicar filtros
    if (filters.type) {
      queryBuilder.andWhere('transaction.type = :type', { type: filters.type });
    }

    if (filters.category) {
      queryBuilder.andWhere('transaction.category = :category', { category: filters.category });
    }

    if (filters.paymentMethod) {
      queryBuilder.andWhere('transaction.paymentMethod = :paymentMethod', { paymentMethod: filters.paymentMethod });
    }

    if (filters.status) {
      queryBuilder.andWhere('transaction.status = :status', { status: filters.status });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('transaction.transactionDate BETWEEN :startDate AND :endDate', { startDate, endDate });
    } else if (startDate) {
      queryBuilder.andWhere('transaction.transactionDate >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('transaction.transactionDate <= :endDate', { endDate });
    }

    if (minAmount !== undefined) {
      queryBuilder.andWhere('transaction.amount >= :minAmount', { minAmount });
    }

    if (maxAmount !== undefined) {
      queryBuilder.andWhere('transaction.amount <= :maxAmount', { maxAmount });
    }

    if (filters.tags && filters.tags.length > 0) {
      queryBuilder.andWhere('transaction.tags && :tags', { tags: filters.tags });
    }

    // Paginação
    queryBuilder
      .orderBy('transaction.transactionDate', 'DESC')
      .addOrderBy('transaction.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [transactions, total] = await queryBuilder.getManyAndCount();

    return {
      transactions,
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['account', 'user'],
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    return transaction;
  }

  async update(id: string, userId: string, updateTransactionDto: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.findById(id);

    if (transaction.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para editar esta transação');
    }

    if (transaction.status === 'cancelled') {
      throw new BadRequestException('Não é possível editar uma transação cancelada');
    }

    // Se estiver alterando o valor ou tipo, recalcular saldo
    if (updateTransactionDto.amount || updateTransactionDto.type) {
      // Para simplificar, vamos permitir apenas alteração de descrição, categoria e tags
      // Mudanças de valor requerem lógica mais complexa
      delete updateTransactionDto.amount;
      delete updateTransactionDto.type;
    }

    Object.assign(transaction, updateTransactionDto);
    return this.transactionRepository.save(transaction);
  }

  async cancel(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.findById(id);

    if (transaction.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para cancelar esta transação');
    }

    if (transaction.status === 'cancelled') {
      throw new BadRequestException('Transação já foi cancelada');
    }

    const account = await this.accountService.findByUserId(userId);
    if (!account) {
      throw new NotFoundException('Conta não encontrada');
    }
    let newBalance = account.currentBalance;

    if (transaction.type === 'income') {
      newBalance -= transaction.amount;
    } else if (transaction.type === 'expense' || transaction.type === 'transfer') {
      newBalance += transaction.amount;
    }

    transaction.status = 'cancelled';
    const cancelledTransaction = await this.transactionRepository.save(transaction);

    await this.accountService.updateBalance(userId, newBalance);

    return cancelledTransaction;
  }

  async getStatistics(userId: string, startDate?: string, endDate?: string) {
    const queryBuilder = this.transactionRepository.createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.status = :status', { status: 'active' });

    if (startDate && endDate) {
      queryBuilder.andWhere('transaction.transactionDate BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const transactions = await queryBuilder.getMany();

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const transfers = transactions
      .filter(t => t.type === 'transfer')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const categoryStats = transactions.reduce((acc, transaction) => {
      const category = transaction.category;
      if (!acc[category]) {
        acc[category] = { income: 0, expense: 0, count: 0 };
      }

      if (transaction.type === 'income') {
        acc[category].income += Number(transaction.amount);
      } else if (transaction.type === 'expense') {
        acc[category].expense += Number(transaction.amount);
      }

      acc[category].count++;
      return acc;
    }, {});

    return {
      income,
      expenses,
      transfers,
      balance: income - expenses,
      transactionCount: transactions.length,
      categoryStats,
    };
  }

  async getCategories(userId: string): Promise<string[]> {
    const categories = await this.transactionRepository.createQueryBuilder('transaction')
      .select('DISTINCT transaction.category', 'category')
      .where('transaction.userId = :userId', { userId })
      .getRawMany();

    return categories.map(c => c.category);
  }
}