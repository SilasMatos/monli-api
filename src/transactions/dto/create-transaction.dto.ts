import { IsNotEmpty, IsString, IsNumber, IsDateString, IsOptional, IsArray, IsIn, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsNumber({}, { message: 'Valor deve ser um número' })
  @Min(0.01, { message: 'Valor deve ser maior que zero' })
  amount: number;

  @IsNotEmpty()
  @IsString()
  @IsIn(['income', 'expense', 'transfer'], { message: 'Tipo deve ser income, expense ou transfer' })
  type: string;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsDateString({}, { message: 'Data da transação deve ser uma data válida' })
  transactionDate: string;

  @IsOptional()
  @IsString()
  @IsIn(['cash', 'card', 'pix', 'transfer', 'bank_slip'], { message: 'Método de pagamento inválido' })
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  transferAccountId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @IsIn(['daily', 'weekly', 'monthly', 'yearly'], { message: 'Tipo de recorrência inválido' })
  recurringType?: string;
}