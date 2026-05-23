import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('api/v2/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(@Req() req: Request) {
    const user = req.user as User;
    return this.dashboardService.getStats(user.id);
  }

  @Get('threat-feed')
  async getThreatFeed(@Req() req: Request) {
    const user = req.user as User;
    return this.dashboardService.getThreatFeed(user.id);
  }

  @Get('sessions')
  async getSessions(@Req() req: Request) {
    const user = req.user as User;
    return this.dashboardService.getSessions(user.id);
  }
}
