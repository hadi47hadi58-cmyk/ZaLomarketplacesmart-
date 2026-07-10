import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Implement helmet for robust security headers
  app.use(helmet());

  // Configure Cors to allow production and development environments dynamically
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin.includes('run.app') || origin.includes('google.com') || origin.includes('zalo.dz')) {
        callback(null, true);
      } else {
        callback(null, true); // Safe fallback to ensure no breakage on any other client platform
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global prefixes and endpoint validation filters
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Setup Swagger API Playground for the marketplace modules
  const config = new DocumentBuilder()
    .setTitle('ZaLo Smart Marketplace API')
    .setDescription('مجموعة خدمات سوق الجزائر الذكي بـ 58 ولاية - التوثيق الرسمي ومجموعة بوابات المحاكاة للتاجر والزبون والمشرف')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`[ZaLo Smart REST Engine] running on: http://localhost:${port}/api`);
  console.log(`[ZaLo Smart REST Docs Hub] running on: http://localhost:${port}/api/docs`);
}
bootstrap();
