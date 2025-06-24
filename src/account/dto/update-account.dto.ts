import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountDto } from './create-account.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateAccountDto extends PartialType(CreateAccountDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}