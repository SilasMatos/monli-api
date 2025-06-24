import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountService } from './services/account.service';
import { FileUploadService } from './services/file-upload.service';
import { AccountController, UploadsController } from './account.controller';
import { Account } from './entities/account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Account])],
  providers: [AccountService, FileUploadService],
  controllers: [AccountController, UploadsController],
  exports: [AccountService, FileUploadService],
})
export class AccountModule { }