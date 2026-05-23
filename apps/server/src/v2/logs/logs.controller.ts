import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LogsService } from './logs.service';

@Controller('api/v2/logs')
@UseGuards(JwtAuthGuard)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  async list(@Req() req: Request) {
    const user = req.user as User;
    return this.logsService.list(user.id);
  }

  @Get('scan-logs')
  async scanLogs(@Req() req: Request) {
    const user = req.user as User;
    return this.logsService.list(user.id);
  }
}
