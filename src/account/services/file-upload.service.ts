import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';

const pump = promisify(pipeline);

@Injectable()
export class FileUploadService {
  private readonly uploadDir: string;
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  constructor(private configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadAvatar(data: any, userId: string): Promise<string> {
    const { mimetype, filename } = data;

    // Validar tipo de arquivo
    if (!this.allowedMimeTypes.includes(mimetype)) {
      throw new BadRequestException('Tipo de arquivo não permitido. Use: JPEG, PNG, GIF ou WebP');
    }

    // Gerar nome único para o arquivo
    const fileExtension = path.extname(filename || '').toLowerCase() || '.jpg';
    const uniqueFilename = `${userId}_${Date.now()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, uniqueFilename);

    try {
      await pump(data.file, fs.createWriteStream(filePath));

      const baseUrl = this.configService.get('BASE_URL') || 'http://localhost:3000';
      return `${baseUrl}/api/v1/uploads/avatars/${uniqueFilename}`;
    } catch (error) {
      throw new BadRequestException('Erro ao fazer upload do arquivo');
    }
  }

  deleteAvatar(avatarUrl: string): boolean {
    try {
      const filename = path.basename(avatarUrl);
      const filePath = path.join(this.uploadDir, filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao deletar avatar:', error);
      return false;
    }
  }

  getAvatarPath(filename: string): string {
    return path.join(this.uploadDir, filename);
  }
}