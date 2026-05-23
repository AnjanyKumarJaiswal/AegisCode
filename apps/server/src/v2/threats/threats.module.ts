import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { ThreatsController } from './threats.controller';
import { ThreatsService } from './threats.service';

@Module({
  imports: [AuthModule],
  controllers: [ThreatsController],
  providers: [ThreatsService],
  exports: [ThreatsService],
})
export class ThreatsModule {}
