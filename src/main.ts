import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  const configService = app.get(ConfigService);

  const fastifyCookie = (await import('@fastify/cookie')).default;
  await app.register(fastifyCookie, {
    secret: (configService.get<string>('COOKIE_SECRET') as string) || 'my-secret-key-for-cookies',
  });

  const fastifyMultipart = (await import('@fastify/multipart')).default;
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 30 * 1024 * 1024, // 30MB
      files: 1,
    },
  });

  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? false : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1');

  const port = configService.get('PORT') || 8080;
  const host = configService.get('HOST') || '0.0.0.0';

  await app.listen(port, host);
  console.log(`Application is running on: http://${host}:${port}/api/v1`);
}

bootstrap().catch((error) => {
  console.error('Error starting the application:', error);
  process.exit(1);
});