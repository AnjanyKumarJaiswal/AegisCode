import { Module } from '@nestjs/common';
import { ScanController } from './scan.controller';
import { ScanService } from './scan.service';
import { SessionModule } from '../session/session.module';
import { McpModule } from '../../mcp/mcp.module';

@Module({
  imports: [SessionModule, McpModule],
  controllers: [ScanController],
  providers: [ScanService],
  exports: [ScanService],
})
export class ScanModule {}
