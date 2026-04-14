import { Module } from '@nestjs/common';
import { GeminiClient } from './client/gemini.service';
import { McpClientService } from './client/mcpClient.service';
import { McpServerService } from './server/mcpServer.service';

@Module({
  providers: [GeminiClient, McpServerService, McpClientService],
  exports: [McpClientService],
})
export class McpModule {}
