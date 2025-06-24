import { IsOptional, IsString, IsNumber, IsBoolean, IsIn, Min } from 'class-validator';

export class CreateAccountDto {
  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Saldo inicial deve ser um número' })
  @Min(0, { message: 'Saldo inicial não pode ser negativo' })
  initialBalance?: number;

  @IsOptional()
  @IsString()
  @IsIn(['light', 'dark', 'auto'], { message: 'Tema deve ser light, dark ou auto' })
  theme?: string;

  @IsOptional()
  @IsString()
  @IsIn(['pt-BR', 'en-US', 'es-ES'], { message: 'Idioma não suportado' })
  language?: string;

  @IsOptional()
  @IsString()
  @IsIn(['BRL', 'USD', 'EUR'], { message: 'Moeda não suportada' })
  currency?: string;

  @IsOptional()
  @IsBoolean()
  notifications?: boolean;

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;
}