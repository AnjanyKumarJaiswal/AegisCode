import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.FRONTEND_BASE_URL,
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 4000);
  console.log('The Backend Server is running on: http://localhost:4000');
}
bootstrap();
