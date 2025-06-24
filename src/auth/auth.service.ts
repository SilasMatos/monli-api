import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FastifyReply } from 'fastify';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  async validateUser(email: string, password: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto, response: FastifyReply) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);

    try {

      response.setCookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      });
    } catch (error) {
      console.error('Erro ao definir cookie:', error);
      throw new InternalServerErrorException('Erro interno do servidor');
    }

    return {
      message: 'Login realizado com sucesso',

    };
  }

  async register(createUserDto: CreateUserDto, response: FastifyReply) {
    const user = await this.usersService.create(createUserDto);
    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);

    try {
      response.setCookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      });
    } catch (error) {
      console.error('Erro ao definir cookie:', error);
      throw new InternalServerErrorException('Erro interno do servidor');
    }

    return {
      message: 'Usuário criado com sucesso',
      user,
    };
  }

  async logout(response: FastifyReply) {
    try {
      response.clearCookie('access_token', {
        path: '/',
      });
    } catch (error) {
      console.error('Erro ao limpar cookie:', error);
    }

    return {
      message: 'Logout realizado com sucesso',
    };
  }

  async refreshToken(user: User, response: FastifyReply) {
    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);

    try {
      response.setCookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      });
    } catch (error) {
      console.error('Erro ao renovar cookie:', error);
      throw new InternalServerErrorException('Erro ao renovar token');
    }

    return {
      message: 'Token renovado com sucesso',

    };
  }
}