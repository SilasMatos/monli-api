import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FastifyReply } from 'fastify';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UserAccessService } from '../users/services/user-access.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly userAccessService: UserAccessService,
    private readonly jwtService: JwtService,
  ) { }

  private getClientInfo(request: any) {
    const ipAddress = request?.ip ||
      request?.connection?.remoteAddress ||
      request?.headers?.['x-forwarded-for'] ||
      request?.headers?.['x-real-ip'] ||
      '127.0.0.1';

    const userAgent = request?.headers?.['user-agent'] || 'Unknown';

    return {
      ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
      userAgent,
    };
  }

  async validateUser(email: string, password: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto, response: FastifyReply, request?: any) {
    const clientInfo = this.getClientInfo(request);

    try {
      const user = await this.validateUser(loginDto.email, loginDto.password);

      if (!user) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      const payload = { email: user.email, sub: user.id };
      const access_token = this.jwtService.sign(payload);

      response.setCookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      });


      await this.userAccessService.create({
        userId: user.id,
        ...clientInfo,
        accessType: 'login',
        success: true,
      });

      const isFirstAccess = await this.userAccessService.isFirstAccess(user.id);
      const accessCount = await this.userAccessService.getAccessCount(user.id);

      return {
        message: 'Login realizado com sucesso',
        success: true,
        user: {
          isFirstAccess,
          accessCount,
        },
      };

    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      console.error('Erro ao fazer login:', error);
      throw new InternalServerErrorException('Erro interno do servidor');
    }
  }

  async register(createUserDto: CreateUserDto, response: FastifyReply, request?: any) {
    const clientInfo = this.getClientInfo(request);

    try {
      const user = await this.usersService.create(createUserDto);
      const payload = { email: user.email, sub: user.id };
      const access_token = this.jwtService.sign(payload);

      // Configurar cookie HTTP-only no Fastify
      response.setCookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      });

      await this.userAccessService.create({
        userId: user.id,
        ...clientInfo,
        accessType: 'register',
        success: true,
      });

      return {
        message: 'Usuário criado com sucesso',
        user: {
          ...user,
          isFirstAccess: true,
          accessCount: 1,
        },
      };

    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      throw error;
    }
  }

  async logout(response: FastifyReply) {
    try {
      response.clearCookie('access_token', {
        path: '/',
      });

      return {
        message: 'Logout realizado com sucesso',
      };

    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      return {
        message: 'Logout realizado com sucesso',
      };
    }
  }
}