import { Controller, Post, Body, UseGuards, Get, Request, Response } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Response({ passthrough: true }) response: FastifyReply,
  ) {
    return this.authService.login(loginDto, response);
  }

  @Post('register')
  async register(
    @Body() createUserDto: CreateUserDto,
    @Response({ passthrough: true }) response: FastifyReply,
  ) {
    return this.authService.register(createUserDto, response);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return {
      user: req.user,
    };
  }

  @Post('logout')
  async logout(@Response({ passthrough: true }) response: FastifyReply) {
    return this.authService.logout(response);
  }

  @UseGuards(JwtAuthGuard)
  @Get('check')
  checkAuth(@Request() req) {
    return {
      authenticated: true,
      user: req.user,
    };
  }
}