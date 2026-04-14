import { Module } from '@nestjs/common';
import { SessionModule } from './session/session.module';
import { ScanModule } from './scan/scan.module';

@Module({
  imports: [SessionModule, ScanModule],
})
export class V1Module {}
