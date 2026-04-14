import { Injectable } from '@nestjs/common';
import { SessionService } from '../session/session.service';
import { McpClientService } from '../../mcp/client/mcpClient.service';
import type { ScanTriggerType } from '../../mcp/tools';

@Injectable()
export class ScanService {
  constructor(
    private readonly sessionService: SessionService,
    private readonly mcpClient: McpClientService,
  ) {}

  async executeScan(
    userId: string,
    sessionId: string,
    filePath: string,
    language: string,
    content: string,
    triggerType: ScanTriggerType = 'MANUAL',
  ) {
    await this.sessionService.validateSessionAccess(sessionId, userId);

    return this.mcpClient.scanCode(
      sessionId,
      userId,
      filePath,
      language,
      content,
      triggerType,
    );
  }
}
