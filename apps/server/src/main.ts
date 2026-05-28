import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  
  app.enableCors((req: any, callback: any) => {
    const isHealth = req.path === '/health' || req.url === '/health';
    const corsOptions = isHealth
      ? { origin: '*' }
      : { origin: process.env.FRONTEND_BASE_URL, credentials: true };
    callback(null, corsOptions);
  });

  
  app.use((req: any, res: any, next: () => void) => {
    console.log(`[HTTP] ${req.method} ${req.originalUrl}`);
    next();
  });

  await app.listen(process.env.PORT ?? 4000);
  console.log('The Backend Server is running on: http://localhost:4000');
}
bootstrap();
