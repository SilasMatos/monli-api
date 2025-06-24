import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserAccessService } from './services/user-access.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userAccessService: UserAccessService,
  ) { }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    const user = req.user;
    const isFirstAccess = await this.userAccessService.isFirstAccess(user.id);
    const accessCount = await this.userAccessService.getAccessCount(user.id);

    return {
      ...user,
      isFirstAccess,
      accessCount,
    };
  }
}