import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';

@Controller('api/v2/settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings(@Req() req: Request) {
    const user = req.user as User;
    return this.settingsService.getSettings(user.id);
  }

  @Put()
  async updateSettings(@Req() req: Request, @Body() body: unknown) {
    const user = req.user as User;
    return this.settingsService.updateSettings(user.id, body);
  }

  @Get('user-profile')
  async getUserProfile(@Req() req: Request) {
    const user = req.user as User;
    return this.settingsService.getUserProfile(user.id);
  }

  @Put('user-profile')
  async updateUserProfile(@Req() req: Request, @Body() body: unknown) {
    const user = req.user as User;
    return this.settingsService.updateUserProfile(user.id, body);
  }
}
