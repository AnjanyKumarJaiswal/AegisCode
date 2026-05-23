import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { VulnerabilitiesController } from './vulnerabilities.controller';
import { VulnerabilitiesService } from './vulnerabilities.service';

@Module({
  imports: [AuthModule],
  controllers: [VulnerabilitiesController],
  providers: [VulnerabilitiesService],
  exports: [VulnerabilitiesService],
})
export class VulnerabilitiesModule {}
