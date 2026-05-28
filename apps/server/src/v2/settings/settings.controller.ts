import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiKeyService } from '../../auth/api-key.service';
import { SettingsService } from './settings.service';

@Controller('api/v2/settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly apiKeyService: ApiKeyService,
  ) {}

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

  @Get('api-keys')
  async listApiKeys(@Req() req: Request) {
    const user = req.user as User;
    return this.apiKeyService.listForUser(user.id);
  }

  @Post('api-keys')
  async createApiKey(@Req() req: Request, @Body() body: { name?: string }) {
    const user = req.user as User;
    return this.apiKeyService.createForUser(user.id, body?.name);
  }

  @Delete('api-keys/:id')
  async revokeApiKey(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as User;
    await this.apiKeyService.revokeForUser(user.id, id);
    return { success: true };
  }
}
