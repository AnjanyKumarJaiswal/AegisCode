import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ThreatsService } from './threats.service';

@Controller('api/v2/threats')
@UseGuards(JwtAuthGuard)
export class ThreatsController {
  constructor(private readonly threatsService: ThreatsService) {}

  @Get('risk-data')
  async riskData(@Req() req: Request, @Query('timeframe') timeframe?: string) {
    const user = req.user as User;
    return this.threatsService.getRiskData(user.id, timeframe);
  }

  @Get('stats')
  async stats(@Req() req: Request) {
    const user = req.user as User;
    return this.threatsService.getStats(user.id);
  }
}
