import { PartialType } from '@nestjs/mapped-types';
import { CreateTransactionDto } from './create-transaction.dto';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {
  @IsOptional()
  @IsString()
  @IsIn(['active', 'cancelled', 'pending'], { message: 'Status inválido' })
  status?: string;
}