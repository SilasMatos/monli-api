// filepath: c:\Users\Silas\Desktop\Meus Projetos\Monli\monli-app\nest-app\src\auth\jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') { }