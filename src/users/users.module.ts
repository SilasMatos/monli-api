import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserAccessService } from './services/user-access.service';
import { User } from './entities/user.entity';
import { UserAccess } from './entities/user-access.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserAccess])],
  providers: [UsersService, UserAccessService],
  controllers: [UsersController],
  exports: [UsersService, UserAccessService],
})
export class UsersModule { }