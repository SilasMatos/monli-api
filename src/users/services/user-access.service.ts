import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccess } from '../entities/user-access.entity';

export interface CreateUserAccessDto {
  userId: string;
  ipAddress: string;
  userAgent?: string;
  accessType: 'login' | 'register';
  success: boolean;
}

@Injectable()
export class UserAccessService {
  constructor(
    @InjectRepository(UserAccess)
    private userAccessRepository: Repository<UserAccess>,
  ) { }

  async create(createUserAccessDto: CreateUserAccessDto): Promise<UserAccess> {
    const userAccess = this.userAccessRepository.create(createUserAccessDto);
    return this.userAccessRepository.save(userAccess);
  }

  async isFirstAccess(userId: string): Promise<boolean> {
    const count = await this.userAccessRepository.count({
      where: { userId, success: true }
    });
    return count <= 1;
  }

  async getAccessCount(userId: string): Promise<number> {
    return this.userAccessRepository.count({
      where: { userId, success: true }
    });
  }
}