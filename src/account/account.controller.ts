import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  BadRequestException,
  Res,
  NotFoundException
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { AccountService } from './services/account.service';
import { FileUploadService } from './services/file-upload.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as fs from 'fs';

@Controller('account')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly fileUploadService: FileUploadService,
  ) { }

  @Post()
  async create(@Request() req, @Body() createAccountDto: CreateAccountDto) {
    return this.accountService.create(req.user.id, createAccountDto);
  }

  @Get()
  async getMyAccount(@Request() req) {
    return this.accountService.findByUserId(req.user.id);
  }

  @Get('stats')
  async getMyStats(@Request() req) {
    return this.accountService.getAccountStats(req.user.id);
  }

  @Patch()
  async update(@Request() req, @Body() updateAccountDto: UpdateAccountDto) {
    return this.accountService.update(req.user.id, updateAccountDto);
  }

  @Post('avatar')
  async uploadAvatar(@Request() req) {
    try {
      const data = await req.file();

      if (!data) {
        throw new BadRequestException('Nenhum arquivo foi enviado');
      }

      const avatarUrl = await this.fileUploadService.uploadAvatar(data, req.user.id);
      const account = await this.accountService.updateAvatar(req.user.id, avatarUrl);

      return {
        message: 'Avatar atualizado com sucesso',
        avatarUrl,
        account,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erro ao fazer upload do avatar');
    }
  }

  @Patch('avatar/url')
  async updateAvatarByUrl(@Request() req, @Body('avatarUrl') avatarUrl: string) {
    if (!avatarUrl) {
      throw new BadRequestException('URL do avatar é obrigatória');
    }
    return this.accountService.updateAvatar(req.user.id, avatarUrl);
  }

  @Patch('balance')
  async updateBalance(@Request() req, @Body('balance') balance: number) {
    if (balance === undefined || balance < 0) {
      throw new BadRequestException('Saldo deve ser um número positivo');
    }
    return this.accountService.updateBalance(req.user.id, balance);
  }

  @Patch('two-factor/toggle')
  async toggleTwoFactor(@Request() req) {
    return this.accountService.toggleTwoFactor(req.user.id);
  }

  @Patch('deactivate')
  async deactivate(@Request() req) {
    return this.accountService.deactivate(req.user.id);
  }

  @Patch('activate')
  async activate(@Request() req) {
    return this.accountService.activate(req.user.id);
  }

  @Get('all')
  async findAll() {
    return this.accountService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.accountService.findById(id);
  }
}

@Controller('uploads')
export class UploadsController {
  constructor(private readonly fileUploadService: FileUploadService) { }

  @Get('avatars/:filename')
  async getAvatar(@Param('filename') filename: string, @Res() res: FastifyReply) {
    try {
      const filePath = this.fileUploadService.getAvatarPath(filename);

      if (!fs.existsSync(filePath)) {
        throw new NotFoundException('Avatar não encontrado');
      }

      const stream = fs.createReadStream(filePath);
      res.type('image/jpeg');
      return res.send(stream);
    } catch (error) {
      throw new NotFoundException('Avatar não encontrado');
    }
  }
}

// POST /api/v1/account - Criar conta
// GET /api/v1/account - Obter minha conta
// GET /api/v1/account/stats - Estatísticas da conta
// PATCH /api/v1/account - Atualizar configurações
// PATCH /api/v1/account/avatar - Atualizar avatar
// PATCH /api/v1/account/balance - Atualizar saldo
// PATCH /api/v1/account/two-factor/toggle - Ativar/desativar 2FA
// PATCH /api/v1/account/deactivate - Desativar conta
// PATCH /api/v1/account/activate - Ativar conta
// GET /api/v1/account/all - Listar todas as contas (admin)
// GET /api/v1/account/:id - Obter conta específica (admin)